<?php

namespace Tests\Orders;

use App\Enums\BusinessTypeEnum;
use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Enums\StockMovementReasonEnum;
use App\Enums\StockMovementTypeEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\Permission;
use App\Models\ProductModel;
use App\Models\RolePermission;
use App\Models\User;
use Tests\TestCase;

/**
 * Devolución de stock ligada a una línea de orden cerrada (módulo de Inventario,
 * exclusivo de negocios retail con stock_enabled). Cubre: devolución parcial válida,
 * acumulación de devoluciones sin exceder lo vendido, bloqueo sobre órdenes no
 * cerradas, gate de negocio (retail + stock_enabled) y permiso manageStock.
 */
class OrderReturnTest extends TestCase
{
    private function marcarComoRetailConStock(bool $stockEnabled = true): void
    {
        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail->value,
            BusinessConfigModel::STOCK_ENABLED => $stockEnabled,
        ]);
    }

    private function crearUsuario(RoleEnum $rol): User
    {
        return User::factory()->create([
            User::ROL_ID => $rol->value,
            User::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function otorgarPermiso(int $roleId, string $key): void
    {
        $permission = Permission::where(Permission::KEY, $key)->firstOrFail();

        RolePermission::create([
            RolePermission::TENANT_ID => BusinessConfigModel::first()->id,
            RolePermission::ROLE_ID => $roleId,
            RolePermission::PERMISSION_ID => $permission->id,
        ]);
    }

    private function crearSistema(): MainOrderReportModel
    {
        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearOrden(int $estatus): OrderModel
    {
        return OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => 'Venta mostrador',
            OrderModel::SISTEMA_ID => $this->crearSistema()->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
            OrderModel::ESTATUS_PEDIDO_ID => $estatus,
            OrderModel::TOTAL => 100,
            OrderModel::SUBTOTAL => 100,
        ]);
    }

    private function crearProductoConStock(float $stock = 10): ProductModel
    {
        return ProductModel::create([
            ProductModel::NOMBRE => 'Producto retail',
            ProductModel::PRECIO => 20,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::MANAGE_STOCK => true,
            ProductModel::STOCK => $stock,
        ]);
    }

    private function crearLineaVendida(OrderModel $orden, ProductModel $producto, float $cantidad): OrderProductModel
    {
        return OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $producto->id,
            OrderProductModel::CANTIDAD => $cantidad,
            OrderProductModel::PRECIO => $producto->precio,
        ]);
    }

    public function test_devolucion_parcial_incrementa_stock_y_registra_movimiento(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        $this->postJson("/api/order/{$orden->id}/product/{$linea->id}/return", [
            'quantity' => 2,
            'note' => 'Cliente devolvió una pieza defectuosa',
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.stock', '12.00');

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $producto->id,
            'type' => StockMovementTypeEnum::Entry->value,
            'reason' => StockMovementReasonEnum::Return->value,
            'quantity' => 2,
            'stock_before' => 10,
            'stock_after' => 12,
            'reference_type' => OrderProductModel::class,
            'reference_id' => $linea->id,
        ]);

        $this->assertEquals(100.0, (float) $orden->fresh()->total);
    }

    public function test_devoluciones_parciales_acumuladas_no_pueden_exceder_lo_vendido(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        $this->postJson("/api/order/{$orden->id}/product/{$linea->id}/return", [
            'quantity' => 3,
        ], $this->authHeaders())->assertStatus(200);

        $this->postJson("/api/order/{$orden->id}/product/{$linea->id}/return", [
            'quantity' => 3,
        ], $this->authHeaders())
            ->assertStatus(422)
            ->assertJsonPath('status', 'error');

        $this->assertEquals(13.0, (float) $producto->fresh()->stock);
    }

    public function test_devolucion_en_orden_no_cerrada_falla(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::IN_PROCESS->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        $this->postJson("/api/order/{$orden->id}/product/{$linea->id}/return", [
            'quantity' => 1,
        ], $this->authHeaders())->assertStatus(400);

        $this->assertEquals(10.0, (float) $producto->fresh()->stock);
    }

    public function test_negocio_no_retail_no_puede_usar_devolucion(): void
    {
        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante->value,
            BusinessConfigModel::STOCK_ENABLED => true,
        ]);
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        $this->postJson("/api/order/{$orden->id}/product/{$linea->id}/return", [
            'quantity' => 1,
        ], $this->authHeaders())->assertStatus(403);
    }

    public function test_retail_sin_stock_enabled_no_puede_usar_devolucion(): void
    {
        $this->marcarComoRetailConStock(stockEnabled: false);
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        $this->postJson("/api/order/{$orden->id}/product/{$linea->id}/return", [
            'quantity' => 1,
        ], $this->authHeaders())->assertStatus(403);
    }

    public function test_rol_sin_manage_stock_no_puede_devolver(): void
    {
        $this->marcarComoRetailConStock();
        $this->otorgarPermiso(RoleEnum::CAJA->value, 'payOrder');
        $caja = $this->crearUsuario(RoleEnum::CAJA);
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        $this->postJson("/api/order/{$orden->id}/product/{$linea->id}/return", [
            'quantity' => 1,
        ], $this->authHeaders($caja))->assertStatus(403);
    }

    public function test_rol_con_manage_stock_puede_devolver(): void
    {
        $this->marcarComoRetailConStock();
        $this->otorgarPermiso(RoleEnum::CAJA->value, 'manageStock');
        $caja = $this->crearUsuario(RoleEnum::CAJA);
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        $this->postJson("/api/order/{$orden->id}/product/{$linea->id}/return", [
            'quantity' => 1,
        ], $this->authHeaders($caja))->assertStatus(200);
    }

    public function test_sin_autenticacion_no_accede(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        $this->postJson("/api/order/{$orden->id}/product/{$linea->id}/return", [
            'quantity' => 1,
        ])->assertStatus(401);
    }
}
