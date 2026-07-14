<?php

namespace Tests\Orders;

use App\Enums\MainOrderStatusEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderStatusModel;
use App\Models\ProductModel;
use App\Enums\RoleEnum;
use App\Models\User;
use Tests\TestCase;

class OrderTest extends TestCase
{
    private function crearReporte(): MainOrderReportModel
    {
        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 500,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearOrden(): OrderModel
    {
        $report = $this->crearReporte();

        return OrderModel::create([
            OrderModel::TOTAL => 100,
            OrderModel::SUBTOTAL => 100,
            OrderModel::DESCUENTO => 0,
            OrderModel::NOMBRE_PEDIDO => 'Test Orden',
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusModel::first()->id,
            OrderModel::SISTEMA_ID => $report->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    // ── Index ────────────────────────────────────────────────

    public function test_lista_ordenes_paginada(): void
    {
        $this->getJson('/api/order?page=1&per_page=10', $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonStructure(['current_page', 'data', 'total', 'per_page']);
    }

    // ── Store ────────────────────────────────────────────────

    public function test_crea_orden(): void
    {
        $report = $this->crearReporte();
        $status = OrderStatusModel::first();

        $response = $this->postJson('/api/order', [
            OrderModel::TOTAL => 150,
            OrderModel::SUBTOTAL => 150,
            OrderModel::DESCUENTO => 0,
            OrderModel::SISTEMA_ID => $report->id,
            OrderModel::NOMBRE_PEDIDO => 'Mesa 5',
            OrderModel::ESTATUS_PEDIDO_ID => $status->id,
        ], $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.nombre_pedido', 'Mesa 5');

        $this->assertDatabaseHas('order', ['nombre_pedido' => 'Mesa 5']);
    }

    public function test_no_crea_orden_sin_campos_requeridos(): void
    {
        $this->postJson('/api/order', [], $this->authHeaders())
            ->assertStatus(400);
    }

    // ── Show ─────────────────────────────────────────────────

    public function test_muestra_orden(): void
    {
        $orden = $this->crearOrden();

        $this->getJson("/api/order/{$orden->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.id', $orden->id);
    }

    // ── Update ───────────────────────────────────────────────

    public function test_actualiza_orden(): void
    {
        $orden = $this->crearOrden();

        $this->putJson("/api/order/{$orden->id}", [
            OrderModel::NOMBRE_PEDIDO => 'Mesa Actualizada',
            OrderModel::DESCUENTO => 10,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.nombre_pedido', 'Mesa Actualizada');

        $this->assertDatabaseHas('order', ['id' => $orden->id, 'nombre_pedido' => 'Mesa Actualizada']);
    }

    // ── Delete ───────────────────────────────────────────────

    public function test_elimina_orden(): void
    {
        $orden = $this->crearOrden();

        $this->deleteJson("/api/order/{$orden->id}", [], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertSoftDeleted('order', ['id' => $orden->id]);
    }

    // ── Total ────────────────────────────────────────────────

    public function test_total_orden(): void
    {
        $orden = $this->crearOrden();

        $this->getJson("/api/order/{$orden->id}/total", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['status', 'data']);
    }

    // ── Show carga relaciones ────────────────────────────────

    public function test_show_orden_incluye_metodo_pago(): void
    {
        $orden = $this->crearOrden();

        $response = $this->getJson("/api/order/{$orden->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $data = $response->json('data');
        $this->assertArrayHasKey('order_products', $data);
    }

    // ── StoreSale (venta directa) ─────────────────────────────

    public function test_crea_venta_directa(): void
    {
        $report = $this->crearReporte();
        $product = ProductModel::create([
            ProductModel::NOMBRE => 'Producto Venta',
            ProductModel::PRECIO => 50,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
        ]);

        $response = $this->postJson('/api/order/sale', [
            'sistema_id' => $report->id,
            'nombre_pedido' => 'Venta Test',
            'items' => [
                [
                    'producto_id' => $product->id,
                    'cantidad' => 2,
                    'precio' => $product->precio,
                ],
            ],
        ], $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.nombre_pedido', 'Venta Test');

        $this->assertDatabaseHas('order', ['nombre_pedido' => 'Venta Test']);
    }

    public function test_venta_directa_sin_items_falla(): void
    {
        $report = $this->crearReporte();

        $this->postJson('/api/order/sale', [
            'sistema_id' => $report->id,
            'nombre_pedido' => 'Sin items',
            'items' => [],
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_venta_directa_sin_sistema_id_falla(): void
    {
        $product = ProductModel::create([
            ProductModel::NOMBRE => 'Prod Sin Sistema',
            ProductModel::PRECIO => 10,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
        ]);

        $this->postJson('/api/order/sale', [
            'nombre_pedido' => 'Sin sistema',
            'items' => [['producto_id' => $product->id, 'cantidad' => 1, 'precio' => $product->precio]],
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_venta_directa_crea_items_cerrados(): void
    {
        $report = $this->crearReporte();
        $product = ProductModel::create([
            ProductModel::NOMBRE => 'Item Venta',
            ProductModel::PRECIO => 30,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
        ]);

        $response = $this->postJson('/api/order/sale', [
            'sistema_id' => $report->id,
            'nombre_pedido' => 'Venta Items',
            'items' => [
                ['producto_id' => $product->id, 'cantidad' => 1, 'precio' => 30],
            ],
        ], $this->authHeaders());

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertArrayHasKey('order_products', $data);
        $this->assertNotEmpty($data['order_products']);
    }

    // ── SalesByCategory ──────────────────────────────────────

    public function test_ventas_por_categoria_retorna_lista(): void
    {
        $report = $this->crearReporte();

        $this->getJson("/api/order/sales-by-category?sistema_id={$report->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['status', 'data']);
    }

    public function test_ventas_por_categoria_con_fecha(): void
    {
        $report = $this->crearReporte();
        $date = now()->toDateString();

        $this->getJson("/api/order/sales-by-category?sistema_id={$report->id}&fecha={$date}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_ventas_por_categoria_sin_sistema_retorna_vacio(): void
    {
        $response = $this->getJson('/api/order/sales-by-category?sistema_id=0', $this->authHeaders())
            ->assertStatus(200);

        $this->assertIsArray($response->json('data'));
    }

    // ── Auth ─────────────────────────────────────────────────

    public function test_sin_token_no_accede(): void
    {
        $this->getJson('/api/order')->assertStatus(401);
    }
}
