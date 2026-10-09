<?php

namespace Tests\Orders;

use App\Enums\BusinessTypeEnum;
use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\ReturnReasonEnum;
use App\Enums\RoleEnum;
use App\Enums\StockMovementReasonEnum;
use App\Enums\StockMovementTypeEnum;
use App\Enums\UnidadMedidaEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\OrderReturnModel;
use App\Models\Permission;
use App\Models\ProductModel;
use App\Models\ProductVariantModel;
use App\Models\RolePermission;
use App\Models\StockMovementModel;
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

        $this->postJson("/api/order/{$orden->id}/return", [
            'reason' => ReturnReasonEnum::Other->value,
            'refund' => false,
            'items' => [['order_product_id' => $linea->id, 'quantity' => 2]],
            'note' => 'Cliente devolvió una pieza defectuosa',
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.reason', ReturnReasonEnum::Other->value)
            ->assertJsonPath('data.items.0.quantity', 2);

        $this->assertEquals(12.0, (float) $producto->fresh()->stock);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $producto->id,
            'type' => StockMovementTypeEnum::Entry->value,
            'reason' => StockMovementReasonEnum::Return->value,
            'quantity' => 2,
            'stock_before' => 10,
            'stock_after' => 12,
            'reference_type' => OrderProductModel::class,
            'reference_id' => $linea->id,
            'order_return_id' => OrderReturnModel::first()->id,
        ]);

        $this->assertEquals(100.0, (float) $orden->fresh()->total);
    }

    public function test_devoluciones_parciales_acumuladas_no_pueden_exceder_lo_vendido(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        $this->postJson("/api/order/{$orden->id}/return", [
            'reason' => ReturnReasonEnum::Other->value,
            'refund' => false,
            'items' => [['order_product_id' => $linea->id, 'quantity' => 3]],
        ], $this->authHeaders())->assertStatus(200);

        $this->postJson("/api/order/{$orden->id}/return", [
            'reason' => ReturnReasonEnum::Other->value,
            'refund' => false,
            'items' => [['order_product_id' => $linea->id, 'quantity' => 3]],
        ], $this->authHeaders())
            ->assertStatus(422)
            ->assertJsonPath('status', 'error');

        $this->assertEquals(13.0, (float) $producto->fresh()->stock);
    }

    public function test_producto_por_unidad_no_acepta_devolucion_decimal(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        $this->postJson("/api/order/{$orden->id}/return", [
            'reason' => ReturnReasonEnum::Other->value,
            'refund' => false,
            'items' => [['order_product_id' => $linea->id, 'quantity' => 1.5]],
        ], $this->authHeaders())
            ->assertStatus(400)
            ->assertJson(['data' => ['items.0.quantity' => ['Los productos por unidad no aceptan cantidades decimales.']]]);

        $this->assertEquals(10.0, (float) $producto->fresh()->stock);
    }

    public function test_producto_por_peso_si_acepta_devolucion_decimal(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $producto->update([ProductModel::UNIDAD_MEDIDA => UnidadMedidaEnum::Kg->value]);
        $linea = $this->crearLineaVendida($orden, $producto, 3);

        $this->postJson("/api/order/{$orden->id}/return", [
            'reason' => ReturnReasonEnum::Other->value,
            'refund' => false,
            'items' => [['order_product_id' => $linea->id, 'quantity' => 1.5]],
        ], $this->authHeaders())->assertStatus(200);

        $this->assertEquals(11.5, (float) $producto->fresh()->stock);
    }

    // ── Devolución de varias líneas, motivo y destino del producto ─────────

    private function devolver(OrderModel $orden, array $items, ReturnReasonEnum $motivo = ReturnReasonEnum::Other, ?User $usuario = null)
    {
        return $this->postJson("/api/order/{$orden->id}/return", [
            'reason' => $motivo->value,
            'refund' => false,
            'items' => $items,
        ], $this->authHeaders($usuario));
    }

    public function test_devuelve_varias_lineas_en_una_sola_devolucion(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $a = $this->crearProductoConStock(10);
        $b = $this->crearProductoConStock(20);
        $lineaA = $this->crearLineaVendida($orden, $a, 3);
        $lineaB = $this->crearLineaVendida($orden, $b, 4);

        $this->devolver($orden, [
            ['order_product_id' => $lineaA->id, 'quantity' => 3],
            ['order_product_id' => $lineaB->id, 'quantity' => 4],
        ])->assertStatus(200)->assertJsonCount(2, 'data.items');

        $this->assertEquals(13.0, (float) $a->fresh()->stock);
        $this->assertEquals(24.0, (float) $b->fresh()->stock);
        $this->assertSame(1, OrderReturnModel::count());
        $this->assertSame(2, StockMovementModel::where('order_return_id', OrderReturnModel::first()->id)->count());
    }

    public function test_si_una_linea_excede_lo_devolvible_no_se_devuelve_ninguna(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $a = $this->crearProductoConStock(10);
        $b = $this->crearProductoConStock(20);
        $lineaA = $this->crearLineaVendida($orden, $a, 3);
        $lineaB = $this->crearLineaVendida($orden, $b, 1);

        $this->devolver($orden, [
            ['order_product_id' => $lineaA->id, 'quantity' => 2],
            ['order_product_id' => $lineaB->id, 'quantity' => 5],
        ])->assertStatus(422)->assertJsonPath('status', 'error');

        $this->assertEquals(10.0, (float) $a->fresh()->stock);
        $this->assertEquals(20.0, (float) $b->fresh()->stock);
        $this->assertSame(0, OrderReturnModel::count());
    }

    public function test_motivo_defectuoso_no_regresa_la_pieza_al_stock_y_registra_merma(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        $this->devolver($orden, [['order_product_id' => $linea->id, 'quantity' => 2]], ReturnReasonEnum::Defective)
            ->assertStatus(200)
            ->assertJsonPath('data.reason', ReturnReasonEnum::Defective->value);

        // La entrada por devolución y la salida por merma se cancelan: el stock vendible no cambia.
        $this->assertEquals(10.0, (float) $producto->fresh()->stock);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $producto->id,
            'type' => StockMovementTypeEnum::Entry->value,
            'reason' => StockMovementReasonEnum::Return->value,
            'quantity' => 2,
            'order_return_id' => OrderReturnModel::first()->id,
        ]);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $producto->id,
            'type' => StockMovementTypeEnum::Exit->value,
            'reason' => StockMovementReasonEnum::Loss->value,
            'quantity' => 2,
            'reference_id' => $linea->id,
            'order_return_id' => OrderReturnModel::first()->id,
        ]);
    }

    public function test_motivo_defectuoso_cuenta_para_el_tope_acumulado(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 3);

        $this->devolver($orden, [['order_product_id' => $linea->id, 'quantity' => 2]], ReturnReasonEnum::Defective)->assertStatus(200);
        // La merma no cuenta como devolución: solo quedan 1 por devolver (3 vendidos − 2 devueltos).
        $this->devolver($orden, [['order_product_id' => $linea->id, 'quantity' => 2]])->assertStatus(422);
        $this->devolver($orden, [['order_product_id' => $linea->id, 'quantity' => 1]])->assertStatus(200);
    }

    public function test_motivo_no_defectuoso_regresa_la_pieza_al_stock(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        $this->devolver($orden, [['order_product_id' => $linea->id, 'quantity' => 2]], ReturnReasonEnum::NotWanted)->assertStatus(200);

        $this->assertEquals(12.0, (float) $producto->fresh()->stock);
        $this->assertDatabaseMissing('stock_movements', ['reason' => StockMovementReasonEnum::Loss->value]);
    }

    public function test_motivo_defectuoso_aplica_la_merma_a_la_variante_vendida(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $variante = ProductVariantModel::create([
            ProductVariantModel::PRODUCT_ID => $producto->id,
            ProductVariantModel::NOMBRE => 'Talla 27',
            ProductVariantModel::PRECIO => 20,
            ProductVariantModel::STOCK => 6,
            ProductVariantModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
        $linea = $this->crearLineaVendida($orden, $producto, 2);
        $linea->update([OrderProductModel::VARIANT_ID => $variante->id]);

        $this->devolver($orden, [['order_product_id' => $linea->id, 'quantity' => 2]], ReturnReasonEnum::Defective)->assertStatus(200);

        $this->assertEquals(6.0, (float) $variante->fresh()->stock);
        $this->assertEquals(10.0, (float) $producto->fresh()->stock);
        $this->assertDatabaseHas('stock_movements', [
            'variant_id' => $variante->id,
            'reason' => StockMovementReasonEnum::Loss->value,
            'quantity' => 2,
        ]);
    }

    public function test_el_motivo_es_obligatorio_y_debe_ser_valido(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $linea = $this->crearLineaVendida($orden, $this->crearProductoConStock(10), 5);
        $items = [['order_product_id' => $linea->id, 'quantity' => 1]];

        $this->postJson("/api/order/{$orden->id}/return", ['items' => $items], $this->authHeaders())
            ->assertStatus(400)
            ->assertJsonPath('data.reason.0', 'Selecciona el motivo de la devolución.');
        $this->postJson("/api/order/{$orden->id}/return", ['reason' => 'robado', 'items' => $items], $this->authHeaders())
            ->assertStatus(400)
            ->assertJsonPath('data.reason.0', 'El motivo de la devolución no es válido.');
    }

    public function test_exige_al_menos_una_linea_y_no_acepta_lineas_repetidas(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $linea = $this->crearLineaVendida($orden, $this->crearProductoConStock(10), 5);

        $this->devolver($orden, [])->assertStatus(400)->assertJson(['data' => ['items' => ['Selecciona al menos un producto a devolver.']]]);
        $this->devolver($orden, [
            ['order_product_id' => $linea->id, 'quantity' => 1],
            ['order_product_id' => $linea->id, 'quantity' => 1],
        ])->assertStatus(400);
    }

    public function test_no_acepta_lineas_de_otra_orden(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $otra = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $lineaAjena = $this->crearLineaVendida($otra, $producto, 5);

        $this->devolver($orden, [['order_product_id' => $lineaAjena->id, 'quantity' => 1]])
            ->assertStatus(400)
            ->assertJson(['data' => ['items.0.order_product_id' => ['La orden no contiene este producto.']]]);

        $this->assertEquals(10.0, (float) $producto->fresh()->stock);
    }

    public function test_el_detalle_de_la_orden_incluye_sus_devoluciones_con_motivo(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $linea = $this->crearLineaVendida($orden, $this->crearProductoConStock(10), 5);

        $this->devolver($orden, [['order_product_id' => $linea->id, 'quantity' => 1]], ReturnReasonEnum::Defective)->assertStatus(200);

        $this->getJson("/api/order/{$orden->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonCount(1, 'data.order_returns')
            ->assertJsonPath('data.order_returns.0.reason', ReturnReasonEnum::Defective->value)
            ->assertJsonPath('data.order_returns.0.created_by.id', User::where('rol_id', RoleEnum::ADMIN->value)->first()->id);
    }

    public function test_devolucion_en_orden_no_cerrada_falla(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::IN_PROCESS->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        $this->postJson("/api/order/{$orden->id}/return", [
            'reason' => ReturnReasonEnum::Other->value,
            'refund' => false,
            'items' => [['order_product_id' => $linea->id, 'quantity' => 1]],
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

        $this->postJson("/api/order/{$orden->id}/return", [
            'reason' => ReturnReasonEnum::Other->value,
            'refund' => false,
            'items' => [['order_product_id' => $linea->id, 'quantity' => 1]],
        ], $this->authHeaders())->assertStatus(403);
    }

    public function test_retail_sin_stock_enabled_no_puede_usar_devolucion(): void
    {
        $this->marcarComoRetailConStock(stockEnabled: false);
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        $this->postJson("/api/order/{$orden->id}/return", [
            'reason' => ReturnReasonEnum::Other->value,
            'refund' => false,
            'items' => [['order_product_id' => $linea->id, 'quantity' => 1]],
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

        $this->postJson("/api/order/{$orden->id}/return", [
            'reason' => ReturnReasonEnum::Other->value,
            'refund' => false,
            'items' => [['order_product_id' => $linea->id, 'quantity' => 1]],
        ], $this->authHeaders($caja))->assertStatus(403);
    }

    public function test_rol_con_manage_stock_puede_devolver(): void
    {
        $this->marcarComoRetailConStock();
        $this->otorgarPermiso(RoleEnum::CAJA->value, 'processReturns');
        $caja = $this->crearUsuario(RoleEnum::CAJA);
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        $this->postJson("/api/order/{$orden->id}/return", [
            'reason' => ReturnReasonEnum::Other->value,
            'refund' => false,
            'items' => [['order_product_id' => $linea->id, 'quantity' => 1]],
        ], $this->authHeaders($caja))->assertStatus(200);
    }

    public function test_sin_autenticacion_no_accede(): void
    {
        $this->marcarComoRetailConStock();
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $producto = $this->crearProductoConStock(10);
        $linea = $this->crearLineaVendida($orden, $producto, 5);

        $this->postJson("/api/order/{$orden->id}/return", [
            'reason' => ReturnReasonEnum::Other->value,
            'refund' => false,
            'items' => [['order_product_id' => $linea->id, 'quantity' => 1]],
        ])->assertStatus(401);
    }
}
