<?php

namespace Tests\Orders;

use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\OrderStatusModel;
use App\Models\ProductModel;
use App\Models\User;
use Tests\TestCase;

class OrderProductTest extends TestCase
{
    private function crearOrden(): OrderModel
    {
        $report = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 500,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        return OrderModel::create([
            OrderModel::TOTAL => 0,
            OrderModel::SUBTOTAL => 0,
            OrderModel::DESCUENTO => 0,
            OrderModel::NOMBRE_PEDIDO => 'Test Orden',
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusModel::first()->id,
            OrderModel::SISTEMA_ID => $report->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearProducto(): ProductModel
    {
        return ProductModel::create([
            ProductModel::NOMBRE => 'Café Test',
            ProductModel::PRECIO => 45,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
        ]);
    }

    // ── Index ────────────────────────────────────────────────

    public function test_lista_productos_de_orden(): void
    {
        $orden = $this->crearOrden();

        $this->getJson("/api/order/{$orden->id}/product", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['status', 'data']);
    }

    // ── Store — producto ─────────────────────────────────────

    public function test_agrega_producto_a_orden(): void
    {
        $orden = $this->crearOrden();
        $product = $this->crearProducto();

        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 2,
            OrderProductModel::PRECIO => $product->precio,
            OrderProductModel::DESCUENTO => 0,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.producto_id', $product->id);

        $this->assertDatabaseHas('order_product', [
            'pedido_id' => $orden->id,
            'producto_id' => $product->id,
        ]);
    }

    public function test_sin_producto_ni_extra_retorna_error(): void
    {
        $orden = $this->crearOrden();

        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 20,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    // ── Show ─────────────────────────────────────────────────

    public function test_muestra_producto_en_orden(): void
    {
        $orden = $this->crearOrden();
        $product = $this->crearProducto();

        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ]);

        $this->getJson("/api/order/{$orden->id}/product/{$product->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    // ── Update ───────────────────────────────────────────────

    public function test_actualiza_producto_en_orden(): void
    {
        $orden = $this->crearOrden();
        $product = $this->crearProducto();

        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ]);

        $this->putJson("/api/order/{$orden->id}/product/{$product->id}", [
            OrderProductModel::CANTIDAD => 3,
            OrderProductModel::DESCUENTO => 5,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.cantidad', 3);
    }

    // ── UpdateNote ───────────────────────────────────────────

    public function test_actualiza_nota_de_item(): void
    {
        $orden = $this->crearOrden();
        $product = $this->crearProducto();

        $item = OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ]);

        $this->putJson("/api/order/{$orden->id}/product/{$item->id}/note", [
            OrderProductModel::OBSERVACION => 'sin azúcar',
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.observacion', 'sin azúcar');
    }

    // ── Delete producto ──────────────────────────────────────

    public function test_elimina_producto_de_orden(): void
    {
        $orden = $this->crearOrden();
        $product = $this->crearProducto();

        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ]);

        $this->deleteJson("/api/order/{$orden->id}/product/{$product->id}", [], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertDatabaseMissing('order_product', [
            'pedido_id' => $orden->id,
            'producto_id' => $product->id,
        ]);
    }

    // ── DeleteExtra ──────────────────────────────────────────

    public function test_elimina_item_de_orden_por_id(): void
    {
        $orden = $this->crearOrden();
        $product = $this->crearProducto();

        $item = OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 20,
            OrderProductModel::DESCUENTO => 0,
        ]);

        $this->deleteJson("/api/order/{$orden->id}/extra/{$item->id}", [], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertDatabaseMissing('order_product', ['id' => $item->id]);
    }

    // ── ToggleReady ──────────────────────────────────────────

    public function test_toggle_ready_marca_item_como_listo(): void
    {
        $orden = $this->crearOrden();
        $product = $this->crearProducto();

        $item = OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ]);

        $this->assertFalse((bool) $item->is_ready);

        $this->patchJson("/api/order/{$orden->id}/product/{$item->id}/ready", [], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.is_ready', true);
    }

    public function test_toggle_ready_desmarca_item_ya_listo(): void
    {
        $orden = $this->crearOrden();
        $product = $this->crearProducto();

        $item = OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
            OrderProductModel::IS_READY => true,
        ]);

        $this->patchJson("/api/order/{$orden->id}/product/{$item->id}/ready", [], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.is_ready', false);
    }

    public function test_toggle_ready_item_inexistente(): void
    {
        $orden = $this->crearOrden();

        $this->patchJson("/api/order/{$orden->id}/product/99999/ready", [], $this->authHeaders())
            ->assertStatus(422);
    }

    // ── restoreServedIfAllReady ──────────────────────────────

    public function test_eliminar_producto_restaura_served_si_restantes_listos(): void
    {
        $orden = $this->crearOrden();
        $prod1 = $this->crearProducto();
        $prod2 = $this->crearProducto();

        // Producto 1 ya listo, producto 2 recién agregado (pendiente)
        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $prod1->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
            OrderProductModel::IS_READY => true,
        ]);

        $item2 = OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $prod2->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
            OrderProductModel::IS_READY => false,
        ]);

        $orden->update(['estatus_pedido_id' => OrderStatusEnum::IN_PROCESS->value]);

        // Cliente cancela el producto pendiente
        $this->deleteJson("/api/order/{$orden->id}/product/{$prod2->id}", [], $this->authHeaders())
            ->assertStatus(200);

        // La orden debe volver a Served automáticamente
        $this->assertEquals(OrderStatusEnum::SERVED->value, $orden->fresh()->estatus_pedido_id);
    }

    public function test_eliminar_extra_restaura_served_si_restantes_listos(): void
    {
        $orden = $this->crearOrden();
        $prod1 = $this->crearProducto();
        $prod2 = $this->crearProducto();

        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $prod1->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
            OrderProductModel::IS_READY => true,
        ]);

        $item2 = OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $prod2->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 30,
            OrderProductModel::DESCUENTO => 0,
            OrderProductModel::IS_READY => false,
        ]);

        $orden->update(['estatus_pedido_id' => OrderStatusEnum::IN_PROCESS->value]);

        // Elimina por ID de item (endpoint deleteExtra), igual que un extra real
        $this->deleteJson("/api/order/{$orden->id}/extra/{$item2->id}", [], $this->authHeaders())
            ->assertStatus(200);

        $this->assertEquals(OrderStatusEnum::SERVED->value, $orden->fresh()->estatus_pedido_id);
    }

    public function test_eliminar_producto_no_restaura_served_si_quedan_pendientes(): void
    {
        $orden = $this->crearOrden();
        $prod1 = $this->crearProducto();
        $prod2 = $this->crearProducto();
        $prod3 = $this->crearProducto();

        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $prod1->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
            OrderProductModel::IS_READY => true,
        ]);

        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $prod2->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
            OrderProductModel::IS_READY => false,
        ]);

        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $prod3->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
            OrderProductModel::IS_READY => false,
        ]);

        $orden->update(['estatus_pedido_id' => OrderStatusEnum::IN_PROCESS->value]);

        // Elimina prod3 pero prod2 sigue pendiente — no debe volver a Served
        $this->deleteJson("/api/order/{$orden->id}/product/{$prod3->id}", [], $this->authHeaders())
            ->assertStatus(200);

        $this->assertEquals(OrderStatusEnum::IN_PROCESS->value, $orden->fresh()->estatus_pedido_id);
    }

    // ── Auth ─────────────────────────────────────────────────

    public function test_sin_token_no_accede(): void
    {
        $this->getJson('/api/order/1/product')->assertStatus(401);
    }
}
