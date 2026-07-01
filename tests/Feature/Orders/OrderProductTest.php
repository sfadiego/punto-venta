<?php

namespace Tests\Feature\Orders;

use App\Enums\MainOrderStatusEnum;
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
            MainOrderReportModel::USER_ID => User::where('rol_id', 1)->first()->id,
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

    // ── Auth ─────────────────────────────────────────────────

    public function test_sin_token_no_accede(): void
    {
        $this->getJson('/api/order/1/product')->assertStatus(401);
    }
}
