<?php

namespace Tests\Orders;

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
use App\Models\ProductModel;
use App\Models\StockMovementModel;
use App\Models\User;
use Tests\TestCase;

class OrderCloseStockTest extends TestCase
{
    private function crearOrden(?int $estatusPedidoId = null): OrderModel
    {
        $report = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 500,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        return OrderModel::create([
            OrderModel::TOTAL => 45,
            OrderModel::SUBTOTAL => 45,
            OrderModel::DESCUENTO => 0,
            OrderModel::NOMBRE_PEDIDO => 'Test Orden',
            OrderModel::ESTATUS_PEDIDO_ID => $estatusPedidoId ?? OrderStatusEnum::IN_PROCESS->value,
            OrderModel::SISTEMA_ID => $report->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearProductoConStock(float $stock = 10): ProductModel
    {
        return ProductModel::create([
            ProductModel::NOMBRE => 'Producto con stock',
            ProductModel::PRECIO => 45,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::MANAGE_STOCK => true,
            ProductModel::STOCK => $stock,
        ]);
    }

    private function agregarProducto(OrderModel $orden, ProductModel $product, float $cantidad): OrderProductModel
    {
        return OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => $cantidad,
            OrderProductModel::PRECIO => $product->precio,
            OrderProductModel::DESCUENTO => 0,
        ]);
    }

    // ── Agregar/quitar productos en InProcess no toca stock ──

    public function test_agregar_producto_a_orden_no_descuenta_stock(): void
    {
        $orden = $this->crearOrden();
        $product = $this->crearProductoConStock(10);

        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 4,
            OrderProductModel::PRECIO => $product->precio,
            OrderProductModel::DESCUENTO => 0,
        ], $this->authHeaders())->assertStatus(200);

        $this->assertEquals(10.0, (float) $product->fresh()->stock);
        $this->assertEquals(0, StockMovementModel::where('product_id', $product->id)->count());
    }

    public function test_eliminar_producto_de_orden_in_process_no_afecta_stock(): void
    {
        $orden = $this->crearOrden();
        $product = $this->crearProductoConStock(10);
        $this->agregarProducto($orden, $product, 4);

        $this->deleteJson("/api/order/{$orden->id}/product/{$product->id}", [], $this->authHeaders())
            ->assertStatus(200);

        $this->assertEquals(10.0, (float) $product->fresh()->stock);
    }

    public function test_eliminar_orden_in_process_no_afecta_stock(): void
    {
        $orden = $this->crearOrden();
        $product = $this->crearProductoConStock(10);
        $this->agregarProducto($orden, $product, 4);

        $this->deleteJson("/api/order/{$orden->id}", [], $this->authHeaders())->assertStatus(200);

        $this->assertEquals(10.0, (float) $product->fresh()->stock);
    }

    // ── Cerrar la orden descuenta stock ───────────────────────

    public function test_cerrar_orden_descuenta_stock_y_registra_movimiento(): void
    {
        $orden = $this->crearOrden();
        $product = $this->crearProductoConStock(10);
        $item = $this->agregarProducto($orden, $product, 4);

        $this->putJson("/api/order/{$orden->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.estatus_pedido_id', OrderStatusEnum::CLOSED->value);

        $this->assertEquals(6.0, (float) $product->fresh()->stock);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => StockMovementTypeEnum::Exit->value,
            'reason' => StockMovementReasonEnum::Sale->value,
            'quantity' => 4,
            'stock_before' => 10,
            'stock_after' => 6,
        ]);
        $this->assertEquals($item->id, StockMovementModel::where('product_id', $product->id)->first()->reference_id);
    }

    public function test_cerrar_orden_con_multiples_productos_descuenta_cada_uno(): void
    {
        $orden = $this->crearOrden();
        $productA = $this->crearProductoConStock(10);
        $productB = $this->crearProductoConStock(5);
        $this->agregarProducto($orden, $productA, 3);
        $this->agregarProducto($orden, $productB, 2);

        $this->putJson("/api/order/{$orden->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
        ], $this->authHeaders())->assertStatus(200);

        $this->assertEquals(7.0, (float) $productA->fresh()->stock);
        $this->assertEquals(3.0, (float) $productB->fresh()->stock);
    }

    public function test_cerrar_orden_con_stock_insuficiente_falla_y_no_cierra(): void
    {
        $orden = $this->crearOrden();
        $product = $this->crearProductoConStock(2);
        $this->agregarProducto($orden, $product, 5);

        $this->putJson("/api/order/{$orden->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
        ], $this->authHeaders())
            ->assertStatus(422)
            ->assertJsonPath('status', 'error');

        $this->assertEquals(2.0, (float) $product->fresh()->stock);
        $this->assertEquals(OrderStatusEnum::IN_PROCESS->value, $orden->fresh()->estatus_pedido_id);
    }

    public function test_cerrar_orden_sin_manage_stock_no_genera_movimiento(): void
    {
        $orden = $this->crearOrden();
        $product = ProductModel::create([
            ProductModel::NOMBRE => 'Producto sin control de stock',
            ProductModel::PRECIO => 45,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
        ]);
        $this->agregarProducto($orden, $product, 3);

        $this->putJson("/api/order/{$orden->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
        ], $this->authHeaders())->assertStatus(200);

        $this->assertEquals(0, StockMovementModel::where('product_id', $product->id)->count());
    }

    // ── Reservar más de lo disponible se bloquea al agregar/actualizar ──

    public function test_no_agrega_producto_si_excede_el_stock_disponible(): void
    {
        $orden = $this->crearOrden();
        $product = $this->crearProductoConStock(5);

        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 6,
            OrderProductModel::PRECIO => $product->precio,
            OrderProductModel::DESCUENTO => 0,
        ], $this->authHeaders())->assertStatus(400);

        $this->assertDatabaseMissing('order_product', [
            'pedido_id' => $orden->id,
            'producto_id' => $product->id,
        ]);
    }

    public function test_no_agrega_producto_si_suma_de_lineas_excede_stock(): void
    {
        // Cada POST crea una línea independiente (ver OrderProductTest::
        // test_agregar_mismo_producto_acumula_total) — el tope debe sumar contra las líneas
        // ya existentes de ese producto en la orden, no solo contra la cantidad del request.
        $orden = $this->crearOrden();
        $product = $this->crearProductoConStock(5);

        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 3,
            OrderProductModel::PRECIO => $product->precio,
            OrderProductModel::DESCUENTO => 0,
        ], $this->authHeaders())->assertStatus(200);

        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 3,
            OrderProductModel::PRECIO => $product->precio,
            OrderProductModel::DESCUENTO => 0,
        ], $this->authHeaders())->assertStatus(400);

        $this->assertEquals(3, OrderProductModel::where('pedido_id', $orden->id)
            ->where('producto_id', $product->id)->sum('cantidad'));
    }

    public function test_no_actualiza_cantidad_si_excede_el_stock_disponible(): void
    {
        $orden = $this->crearOrden();
        $product = $this->crearProductoConStock(5);
        $item = $this->agregarProducto($orden, $product, 3);

        $this->putJson("/api/order/{$orden->id}/product/{$item->id}", [
            OrderProductModel::CANTIDAD => 6,
        ], $this->authHeaders())->assertStatus(400);

        $this->assertEquals(3, $item->fresh()->cantidad);
    }

    public function test_agrega_producto_con_variante_sin_topar_por_stock(): void
    {
        // Una línea de variante no descuenta stock (ver OrderSaleService) — no debe limitarse
        // por la existencia del producto base.
        $orden = $this->crearOrden();
        $product = $this->crearProductoConStock(1);
        $variant = \App\Models\ProductVariantModel::factory()->create([
            \App\Models\ProductVariantModel::PRODUCT_ID => $product->id,
            'tenant_id' => BusinessConfigModel::first()->id,
        ]);

        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::VARIANT_ID => $variant->id,
            OrderProductModel::CANTIDAD => 10,
            OrderProductModel::PRECIO => $variant->precio,
            OrderProductModel::DESCUENTO => 0,
        ], $this->authHeaders())->assertStatus(200);
    }

    public function test_cerrar_orden_ya_cerrada_no_vuelve_a_descontar_stock(): void
    {
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $product = $this->crearProductoConStock(10);
        $this->agregarProducto($orden, $product, 4);

        // La orden ya estaba Closed — actualizar otro campo (ej. nombre) no debe re-descontar.
        $this->putJson("/api/order/{$orden->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
            'nombre_pedido' => 'Actualizada',
        ], $this->authHeaders())->assertStatus(200);

        $this->assertEquals(10.0, (float) $product->fresh()->stock);
    }
}
