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
use App\Models\StockMovementModel;
use App\Models\User;
use Tests\TestCase;

/**
 * Cubre las piezas de "descubrimiento" de devoluciones que quedaron sin test dedicado tras
 * implementar el buscador de órdenes del módulo de Inventario:
 * - GET /order/closed-list (combobox de devolución — OrderController::listClosed).
 * - has_return en GET /order (indicador en listados, OrderService::makeQuery withExists).
 * - orderProducts.stockMovements en GET /order/{id} (sección de devoluciones en el detalle,
 *   OrderController::show).
 */
class OrderReturnDiscoveryTest extends TestCase
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

    private function crearOrden(int $estatus, ?string $nombre = null): OrderModel
    {
        return OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => $nombre ?? 'Venta mostrador',
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

    // ── GET /order/closed-list ─────────────────────────────

    public function test_closed_list_solo_incluye_ordenes_cerradas(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearOrden(OrderStatusEnum::IN_PROCESS->value, 'En proceso');
        $cerrada = $this->crearOrden(OrderStatusEnum::CLOSED->value, 'Cerrada');

        $response = $this->getJson('/api/order/closed-list', $this->authHeaders())->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($cerrada->id, $ids);
        $this->assertCount(1, $ids);
    }

    public function test_closed_list_filtra_por_busqueda(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearOrden(OrderStatusEnum::CLOSED->value, 'VTA-000001-AA');
        $objetivo = $this->crearOrden(OrderStatusEnum::CLOSED->value, 'VTA-999999-ZZ');

        $response = $this->getJson('/api/order/closed-list?search=999999', $this->authHeaders())
            ->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertEquals([$objetivo->id], $ids);
    }

    public function test_closed_list_encuentra_ordenes_de_sesiones_antiguas(): void
    {
        $this->marcarComoRetailConStock();
        $antigua = $this->crearOrden(OrderStatusEnum::CLOSED->value, 'Orden antigua');
        $antigua->update(['created_at' => now()->subDays(45)]);

        $response = $this->getJson('/api/order/closed-list', $this->authHeaders())->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($antigua->id, $ids);
    }

    public function test_closed_list_requiere_manage_stock(): void
    {
        $this->marcarComoRetailConStock();
        $this->otorgarPermiso(RoleEnum::CAJA->value, 'payOrder');
        $caja = $this->crearUsuario(RoleEnum::CAJA);

        $this->getJson('/api/order/closed-list', $this->authHeaders($caja))->assertStatus(403);
    }

    public function test_closed_list_requiere_negocio_retail(): void
    {
        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante->value,
            BusinessConfigModel::STOCK_ENABLED => true,
        ]);

        $this->getJson('/api/order/closed-list', $this->authHeaders())->assertStatus(403);
    }

    public function test_closed_list_sin_autenticacion_no_accede(): void
    {
        $this->getJson('/api/order/closed-list')->assertStatus(401);
    }

    // ── has_return en GET /order ───────────────────────────

    public function test_listado_de_ordenes_marca_has_return_cuando_hay_devolucion(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        $this->postJson("/api/order/{$orden->id}/product/{$linea->id}/return", [
            'quantity' => 2,
        ], $this->authHeaders())->assertStatus(200);

        $response = $this->getJson("/api/order?estatus_pedido_id={$orden->estatus_pedido_id}", $this->authHeaders())
            ->assertStatus(206);

        $row = collect($response->json('data'))->firstWhere('id', $orden->id);
        $this->assertNotNull($row);
        $this->assertTrue($row['has_return']);
    }

    public function test_listado_de_ordenes_no_marca_has_return_sin_devolucion(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $this->crearLineaVendida($orden, $producto, 5);

        $response = $this->getJson("/api/order?estatus_pedido_id={$orden->estatus_pedido_id}", $this->authHeaders())
            ->assertStatus(206);

        $row = collect($response->json('data'))->firstWhere('id', $orden->id);
        $this->assertNotNull($row);
        $this->assertFalse($row['has_return']);
    }

    // ── orderProducts.stockMovements en GET /order/{id} ────

    public function test_show_incluye_solo_movimientos_de_devolucion_en_cada_linea(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        // Movimiento de venta (no debe aparecer) y de devolución (sí debe aparecer).
        StockMovementModel::create([
            StockMovementModel::PRODUCT_ID => $producto->id,
            StockMovementModel::TYPE => StockMovementTypeEnum::Exit,
            StockMovementModel::QUANTITY => 5,
            StockMovementModel::STOCK_BEFORE => 10,
            StockMovementModel::STOCK_AFTER => 5,
            StockMovementModel::REASON => StockMovementReasonEnum::Sale,
            StockMovementModel::TENANT_ID => BusinessConfigModel::first()->id,
            'reference_type' => OrderProductModel::class,
            'reference_id' => $linea->id,
        ]);

        $this->postJson("/api/order/{$orden->id}/product/{$linea->id}/return", [
            'quantity' => 2,
            'note' => 'Prueba',
        ], $this->authHeaders())->assertStatus(200);

        $response = $this->getJson("/api/order/{$orden->id}", $this->authHeaders())->assertStatus(200);

        $lineaRespuesta = collect($response->json('data.order_products'))->firstWhere('id', $linea->id);
        $this->assertNotNull($lineaRespuesta);
        $this->assertCount(1, $lineaRespuesta['stock_movements']);
        $this->assertEquals('return', $lineaRespuesta['stock_movements'][0]['reason']);
        $this->assertEquals('2.00', $lineaRespuesta['stock_movements'][0]['quantity']);
    }

    public function test_show_de_orden_sin_devoluciones_trae_stock_movements_vacio(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        $response = $this->getJson("/api/order/{$orden->id}", $this->authHeaders())->assertStatus(200);

        $lineaRespuesta = collect($response->json('data.order_products'))->firstWhere('id', $linea->id);
        $this->assertNotNull($lineaRespuesta);
        $this->assertCount(0, $lineaRespuesta['stock_movements']);
    }
}
