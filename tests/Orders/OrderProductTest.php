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
    private function crearOrden(?int $estatusPedidoId = null): OrderModel
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
            OrderModel::ESTATUS_PEDIDO_ID => $estatusPedidoId ?? OrderStatusModel::first()->id,
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

    // ── Totales de orden ─────────────────────────────────────

    public function test_agrega_producto_actualiza_total_de_orden(): void
    {
        $orden = $this->crearOrden();
        $product = $this->crearProducto(); // precio = 45

        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 2,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ], $this->authHeaders())->assertStatus(200);

        $orden->refresh();
        $this->assertEquals(90.0, (float) $orden->subtotal);
        $this->assertEquals(90.0, (float) $orden->total);
    }

    public function test_agregar_mismo_producto_acumula_total(): void
    {
        $orden = $this->crearOrden();
        $product = $this->crearProducto(); // precio = 45

        $payload = [
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ];

        $this->postJson("/api/order/{$orden->id}/product", $payload, $this->authHeaders())->assertStatus(200);
        $this->postJson("/api/order/{$orden->id}/product", $payload, $this->authHeaders())->assertStatus(200);

        $orden->refresh();
        $this->assertEquals(90.0, (float) $orden->subtotal);
        $this->assertEquals(90.0, (float) $orden->total);
        // Each add creates a separate row — two rows of qty 1, not one row of qty 2
        $this->assertEquals(2, OrderProductModel::where('pedido_id', $orden->id)
            ->where('producto_id', $product->id)->count());
    }

    public function test_agrega_extra_actualiza_total_de_orden(): void
    {
        $orden = $this->crearOrden();

        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::NOMBRE_EXTRA => 'Salsa extra',
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 15,
            OrderProductModel::DESCUENTO => 0,
        ], $this->authHeaders())->assertStatus(200);

        $orden->refresh();
        $this->assertEquals(15.0, (float) $orden->subtotal);
        $this->assertEquals(15.0, (float) $orden->total);
    }

    public function test_agrega_producto_con_descuento_de_orden_aplica_correctamente(): void
    {
        $orden = $this->crearOrden();
        $orden->update([OrderModel::DESCUENTO => 10]); // 10% descuento en toda la orden
        $product = $this->crearProducto(); // precio = 45

        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 2,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ], $this->authHeaders())->assertStatus(200);

        $orden->refresh();
        $this->assertEquals(90.0, (float) $orden->subtotal);
        $this->assertEquals(81.0, (float) $orden->total); // 90 - 10%
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

        $item = OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ]);

        $this->putJson("/api/order/{$orden->id}/product/{$item->id}", [
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

    // ── Orden cerrada — no se puede modificar ─────────────────

    public function test_agregar_producto_a_orden_cerrada_falla(): void
    {
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $product = $this->crearProducto();

        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => $product->precio,
            OrderProductModel::DESCUENTO => 0,
        ], $this->authHeaders())
            ->assertStatus(422)
            ->assertJsonPath('status', 'error');

        $this->assertDatabaseMissing('order_product', [
            'pedido_id' => $orden->id,
            'producto_id' => $product->id,
        ]);
    }

    public function test_agregar_extra_a_orden_cerrada_falla(): void
    {
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);

        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::NOMBRE_EXTRA => 'Envío a domicilio',
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 30,
            OrderProductModel::DESCUENTO => 0,
        ], $this->authHeaders())
            ->assertStatus(422)
            ->assertJsonPath('status', 'error');

        $this->assertDatabaseMissing('order_product', [
            'pedido_id' => $orden->id,
            'nombre_extra' => 'Envío a domicilio',
        ]);
    }

    public function test_actualizar_producto_en_orden_cerrada_falla(): void
    {
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $product = $this->crearProducto();

        $item = OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ]);

        $this->putJson("/api/order/{$orden->id}/product/{$item->id}", [
            OrderProductModel::CANTIDAD => 5,
        ], $this->authHeaders())
            ->assertStatus(422)
            ->assertJsonPath('status', 'error');

        $this->assertDatabaseHas('order_product', [
            'id' => $item->id,
            'cantidad' => 1,
        ]);
    }

    public function test_eliminar_producto_de_orden_cerrada_falla(): void
    {
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $product = $this->crearProducto();

        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ]);

        $this->deleteJson("/api/order/{$orden->id}/product/{$product->id}", [], $this->authHeaders())
            ->assertStatus(422)
            ->assertJsonPath('status', 'error');

        $this->assertDatabaseHas('order_product', [
            'pedido_id' => $orden->id,
            'producto_id' => $product->id,
        ]);
    }

    public function test_eliminar_item_de_orden_cerrada_por_id_falla(): void
    {
        $orden = $this->crearOrden(OrderStatusEnum::CLOSED->value);
        $product = $this->crearProducto();

        $item = OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 20,
            OrderProductModel::DESCUENTO => 0,
        ]);

        $this->deleteJson("/api/order/{$orden->id}/extra/{$item->id}", [], $this->authHeaders())
            ->assertStatus(422)
            ->assertJsonPath('status', 'error');

        $this->assertDatabaseHas('order_product', ['id' => $item->id]);
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

    // ── is_ready preserved when same product added again ──────

    public function test_agregar_mismo_producto_preserva_is_ready_del_primero(): void
    {
        $orden = $this->crearOrden();
        $prod = $this->crearProducto();

        // Primer café ya marcado como listo por la cocina
        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $prod->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
            OrderProductModel::IS_READY => true,
        ]);

        // Mesero agrega el mismo producto por segunda persona — crea fila nueva
        $response = $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $prod->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.is_ready', false)  // nuevo item arranca sin listo
            ->assertJsonPath('data.cantidad', 1);      // su propia cantidad

        // El primer item sigue marcado como listo
        $this->assertDatabaseHas('order_product', [
            'pedido_id' => $orden->id,
            'producto_id' => $prod->id,
            'is_ready' => true,
        ]);

        // Hay exactamente dos filas para ese producto
        $this->assertEquals(2, OrderProductModel::where('pedido_id', $orden->id)
            ->where('producto_id', $prod->id)->count());
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

    // ── Totales: update ─────────────────────────────────────

    public function test_actualizar_cantidad_recalcula_total(): void
    {
        $orden = $this->crearOrden();
        $orden->update([OrderModel::SUBTOTAL => 45, OrderModel::TOTAL => 45]);
        $product = $this->crearProducto();

        $item = OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ]);

        // Sube de 1 a 3 unidades → delta = +90
        $this->putJson("/api/order/{$orden->id}/product/{$item->id}", [
            OrderProductModel::CANTIDAD => 3,
        ], $this->authHeaders())->assertStatus(200);

        $orden->refresh();
        $this->assertEquals(135.0, (float) $orden->subtotal); // 45 + 90
        $this->assertEquals(135.0, (float) $orden->total);
    }

    public function test_actualizar_descuento_de_linea_recalcula_total(): void
    {
        $orden = $this->crearOrden();
        $orden->update([OrderModel::SUBTOTAL => 90, OrderModel::TOTAL => 90]);
        $product = $this->crearProducto();

        $item = OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 2,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ]);

        // Aplica 10% de descuento → nueva línea = 81, delta = -9
        $this->putJson("/api/order/{$orden->id}/product/{$item->id}", [
            OrderProductModel::DESCUENTO => 10,
        ], $this->authHeaders())->assertStatus(200);

        $orden->refresh();
        $this->assertEquals(81.0, (float) $orden->subtotal); // 90 - 9
        $this->assertEquals(81.0, (float) $orden->total);
    }

    public function test_bajar_cantidad_a_cero_via_update_no_rompe_total(): void
    {
        // Bajar la cantidad vía update (no delete) aplica delta negativo correctamente
        $orden = $this->crearOrden();
        $orden->update([OrderModel::SUBTOTAL => 90, OrderModel::TOTAL => 90]);
        $product = $this->crearProducto();

        $item = OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 2,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ]);

        // Reduce de 2 a 1 → delta = -45
        $this->putJson("/api/order/{$orden->id}/product/{$item->id}", [
            OrderProductModel::CANTIDAD => 1,
        ], $this->authHeaders())->assertStatus(200);

        $orden->refresh();
        $this->assertEquals(45.0, (float) $orden->subtotal);
        $this->assertEquals(45.0, (float) $orden->total);
    }

    // ── Totales: delete / deleteExtra ────────────────────────

    public function test_eliminar_producto_reduce_total(): void
    {
        $orden = $this->crearOrden();
        $product = $this->crearProducto();

        // Agrega vía API para que el total quede registrado
        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 2,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ], $this->authHeaders())->assertStatus(200);

        $orden->refresh();
        $this->assertEquals(90.0, (float) $orden->subtotal);

        $this->deleteJson("/api/order/{$orden->id}/product/{$product->id}", [], $this->authHeaders())
            ->assertStatus(200);

        $orden->refresh();
        $this->assertEquals(0.0, (float) $orden->subtotal);
        $this->assertEquals(0.0, (float) $orden->total);
    }

    public function test_eliminar_extra_reduce_total(): void
    {
        $orden = $this->crearOrden();

        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::NOMBRE_EXTRA => 'Salsa extra',
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 20,
            OrderProductModel::DESCUENTO => 0,
        ], $this->authHeaders())->assertStatus(200);

        $orden->refresh();
        $this->assertEquals(20.0, (float) $orden->subtotal);

        $item = OrderProductModel::where('pedido_id', $orden->id)->first();

        $this->deleteJson("/api/order/{$orden->id}/extra/{$item->id}", [], $this->authHeaders())
            ->assertStatus(200);

        $orden->refresh();
        $this->assertEquals(0.0, (float) $orden->subtotal);
        $this->assertEquals(0.0, (float) $orden->total);
    }

    public function test_multiples_productos_acumulan_total_correctamente(): void
    {
        $orden = $this->crearOrden();
        $prodA = $this->crearProducto(); // precio 45
        $prodB = $this->crearProducto(); // precio 45

        // Agrega A (×2 = 90)
        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $prodA->id,
            OrderProductModel::CANTIDAD => 2,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ], $this->authHeaders())->assertStatus(200);

        // Agrega B (×1 = 45)
        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $prodB->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ], $this->authHeaders())->assertStatus(200);

        // Agrega A de nuevo (×1 = 45, fila separada)
        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $prodA->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ], $this->authHeaders())->assertStatus(200);

        $orden->refresh();
        $this->assertEquals(180.0, (float) $orden->subtotal); // 90 + 45 + 45
        $this->assertEquals(180.0, (float) $orden->total);
    }

    public function test_total_con_descuento_de_orden_y_linea(): void
    {
        $orden = $this->crearOrden();
        $orden->update([OrderModel::DESCUENTO => 10]); // 10% descuento global
        $product = $this->crearProducto();

        // Agrega 2 unidades a $45 con 20% descuento de línea
        // Subtotal línea = 2 × 45 × (1 - 0.20) = 72
        // Total orden    = 72 × (1 - 0.10) = 64.8
        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => 2,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 20,
        ], $this->authHeaders())->assertStatus(200);

        $orden->refresh();
        $this->assertEquals(72.0, (float) $orden->subtotal);
        $this->assertEquals(64.8, (float) $orden->total);
    }

    // ── Auth ─────────────────────────────────────────────────

    public function test_sin_token_no_accede(): void
    {
        $this->getJson('/api/order/1/product')->assertStatus(401);
    }
}
