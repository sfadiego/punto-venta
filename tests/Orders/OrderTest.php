<?php

namespace Tests\Orders;

use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\CustomerModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderStatusModel;
use App\Models\ProductModel;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Broadcasting\Factory as BroadcastingFactoryContract;
use RuntimeException;
use Tests\TestCase;

class OrderTest extends TestCase
{
    private function crearReporte(?MainOrderStatusEnum $estatusCaja = null): MainOrderReportModel
    {
        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => $estatusCaja ?? MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 500,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearOrden(?MainOrderStatusEnum $estatusCaja = null): OrderModel
    {
        $report = $this->crearReporte($estatusCaja);

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

    public function test_lista_ordenes_filtra_por_mes(): void
    {
        $orden = $this->crearOrden();
        $mesActual = now()->format('Y-m');
        $mesPasado = now()->subMonthNoOverflow()->format('Y-m');

        $this->getJson(
            "/api/order?sistema_id={$orden->sistema_id}&estatus_pedido_id={$orden->estatus_pedido_id}&mes={$mesActual}",
            $this->authHeaders()
        )->assertStatus(206)->assertJsonPath('total', 1);

        $this->getJson(
            "/api/order?sistema_id={$orden->sistema_id}&estatus_pedido_id={$orden->estatus_pedido_id}&mes={$mesPasado}",
            $this->authHeaders()
        )->assertStatus(206)->assertJsonPath('total', 0);
    }

    public function test_lista_ordenes_fecha_tiene_prioridad_sobre_mes(): void
    {
        $orden = $this->crearOrden();
        $hoy = now()->toDateString();
        $mesPasado = now()->subMonthNoOverflow()->format('Y-m');

        // Si vienen ambos, "fecha" debe ganar aunque "mes" apunte a otro período.
        $this->getJson(
            "/api/order?sistema_id={$orden->sistema_id}&estatus_pedido_id={$orden->estatus_pedido_id}&fecha={$hoy}&mes={$mesPasado}",
            $this->authHeaders()
        )->assertStatus(206)->assertJsonPath('total', 1);
    }

    public function test_lista_ordenes_filtra_por_semana(): void
    {
        $orden = $this->crearOrden();
        $semanaActual = now()->startOfWeek(Carbon::MONDAY)->toDateString();
        $semanaPasada = now()->subWeek()->startOfWeek(Carbon::MONDAY)->toDateString();

        $this->getJson(
            "/api/order?sistema_id={$orden->sistema_id}&estatus_pedido_id={$orden->estatus_pedido_id}&semana={$semanaActual}",
            $this->authHeaders()
        )->assertStatus(206)->assertJsonPath('total', 1);

        $this->getJson(
            "/api/order?sistema_id={$orden->sistema_id}&estatus_pedido_id={$orden->estatus_pedido_id}&semana={$semanaPasada}",
            $this->authHeaders()
        )->assertStatus(206)->assertJsonPath('total', 0);
    }

    public function test_lista_ordenes_fecha_tiene_prioridad_sobre_semana(): void
    {
        $orden = $this->crearOrden();
        $hoy = now()->toDateString();
        $semanaPasada = now()->subWeek()->startOfWeek(Carbon::MONDAY)->toDateString();

        $this->getJson(
            "/api/order?sistema_id={$orden->sistema_id}&estatus_pedido_id={$orden->estatus_pedido_id}&fecha={$hoy}&semana={$semanaPasada}",
            $this->authHeaders()
        )->assertStatus(206)->assertJsonPath('total', 1);
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

    public function test_no_crea_orden_con_caja_cerrada(): void
    {
        $report = $this->crearReporte(MainOrderStatusEnum::CLOSED);
        $status = OrderStatusModel::first();

        $this->postJson('/api/order', [
            OrderModel::TOTAL => 150,
            OrderModel::SUBTOTAL => 150,
            OrderModel::DESCUENTO => 0,
            OrderModel::SISTEMA_ID => $report->id,
            OrderModel::NOMBRE_PEDIDO => 'Mesa con caja cerrada',
            OrderModel::ESTATUS_PEDIDO_ID => $status->id,
        ], $this->authHeaders())
            ->assertStatus(400)
            ->assertJsonPath('data.sistema_id.0', 'La caja de esta venta ya está cerrada.');

        $this->assertDatabaseMissing('order', ['nombre_pedido' => 'Mesa con caja cerrada']);
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

    public function test_show_orden_incluye_telefono_del_cliente(): void
    {
        $customer = CustomerModel::create([
            CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
            CustomerModel::NAME => 'Cliente Show',
            CustomerModel::PHONE => '3101112222',
        ]);
        $orden = $this->crearOrden();
        $orden->update([OrderModel::CUSTOMER_ID => $customer->id]);

        $response = $this->getJson("/api/order/{$orden->id}", $this->authHeaders())
            ->assertStatus(200);

        $response->assertJsonPath('data.customer.name', 'Cliente Show')
            ->assertJsonPath('data.customer.phone', '3101112222');
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

    public function test_actualiza_orden_costo_domicilio(): void
    {
        $orden = $this->crearOrden();

        $this->putJson("/api/order/{$orden->id}", [
            OrderModel::COSTO_DOMICILIO => -35,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertDatabaseHas('order', ['id' => $orden->id, 'costo_domicilio' => -35]);
    }

    public function test_actualiza_orden_is_delivery(): void
    {
        $orden = $this->crearOrden();

        $this->putJson("/api/order/{$orden->id}", [
            OrderModel::COSTO_DOMICILIO => 35,
            OrderModel::IS_DELIVERY => true,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertDatabaseHas('order', ['id' => $orden->id, 'costo_domicilio' => 35, 'is_delivery' => true]);
    }

    public function test_actualiza_orden_desactiva_is_delivery(): void
    {
        $orden = $this->crearOrden();
        $orden->update([OrderModel::COSTO_DOMICILIO => 35, OrderModel::IS_DELIVERY => true]);

        $this->putJson("/api/order/{$orden->id}", [
            OrderModel::COSTO_DOMICILIO => 0,
            OrderModel::IS_DELIVERY => false,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertDatabaseHas('order', ['id' => $orden->id, 'costo_domicilio' => 0, 'is_delivery' => false]);
    }

    public function test_actualiza_orden_is_delivery_invalido_falla(): void
    {
        $orden = $this->crearOrden();

        $this->putJson("/api/order/{$orden->id}", [
            OrderModel::IS_DELIVERY => 'no-es-booleano',
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_cierra_orden_con_caja_cerrada(): void
    {
        $orden = $this->crearOrden(MainOrderStatusEnum::CLOSED);

        $this->putJson("/api/order/{$orden->id}", [
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
        ], $this->authHeaders())
            ->assertStatus(400)
            ->assertJsonPath('data.sistema_id.0', 'La caja de esta venta ya está cerrada.');

        $this->assertDatabaseHas('order', [
            'id' => $orden->id,
            'estatus_pedido_id' => OrderStatusModel::first()->id,
        ]);
    }

    public function test_edita_datos_de_orden_aunque_la_caja_ya_este_cerrada(): void
    {
        // El guard de caja solo bloquea CERRAR (cobrar) la venta — corregir datos
        // menores (ej. nombre) de una orden que quedó InProcess sigue permitido.
        $orden = $this->crearOrden(MainOrderStatusEnum::CLOSED);

        $this->putJson("/api/order/{$orden->id}", [
            OrderModel::NOMBRE_PEDIDO => 'Mesa Corregida',
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertDatabaseHas('order', ['id' => $orden->id, 'nombre_pedido' => 'Mesa Corregida']);
    }

    public function test_actualiza_orden_incluye_telefono_del_cliente(): void
    {
        $customer = CustomerModel::create([
            CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
            CustomerModel::NAME => 'Cliente Update',
            CustomerModel::PHONE => '3119876543',
        ]);
        $orden = $this->crearOrden();
        $orden->update([OrderModel::CUSTOMER_ID => $customer->id]);

        $response = $this->putJson("/api/order/{$orden->id}", [
            OrderModel::DESCUENTO => 5,
        ], $this->authHeaders())
            ->assertStatus(200);

        $response->assertJsonPath('data.customer.phone', '3119876543');
    }

    // ── Resiliencia de broadcast (Reverb) ───────────────────────
    // Regresión: en producción, OrderController::broadcast() (ShouldBroadcastNow)
    // podía colgar la request de cierre de venta hasta 20s si Reverb estaba caído
    // o lento, provocando timeout en el cliente aunque la orden ya se hubiera
    // actualizado en base de datos. broadcast() atrapa el error — estos tests
    // verifican que la orden se actualiza y la respuesta es 200 aun si el
    // broadcaster lanza una excepción.

    public function test_actualiza_orden_aunque_falle_el_broadcast(): void
    {
        $this->mock(BroadcastingFactoryContract::class, function ($mock) {
            $mock->shouldReceive('connection')->andThrow(new RuntimeException('Reverb unreachable'));
        });

        $orden = $this->crearOrden();

        $this->putJson("/api/order/{$orden->id}", [
            OrderModel::NOMBRE_PEDIDO => 'Mesa Actualizada Sin Reverb',
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.nombre_pedido', 'Mesa Actualizada Sin Reverb');

        $this->assertDatabaseHas('order', ['id' => $orden->id, 'nombre_pedido' => 'Mesa Actualizada Sin Reverb']);
    }

    public function test_cierra_orden_aunque_falle_el_broadcast(): void
    {
        $this->mock(BroadcastingFactoryContract::class, function ($mock) {
            $mock->shouldReceive('connection')->andThrow(new RuntimeException('Reverb unreachable'));
        });

        $orden = $this->crearOrden();

        $this->putJson("/api/order/{$orden->id}", [
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertDatabaseHas('order', [
            'id' => $orden->id,
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
        ]);
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
            ->assertJsonStructure(['status', 'data' => ['categories', 'domicilios']]);
    }

    public function test_ventas_por_categoria_con_fecha(): void
    {
        $report = $this->crearReporte();
        $date = now()->toDateString();

        $this->getJson("/api/order/sales-by-category?sistema_id={$report->id}&fecha={$date}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_ventas_por_categoria_sin_sistema_ni_fecha_falla(): void
    {
        $this->getJson('/api/order/sales-by-category?sistema_id=0', $this->authHeaders())
            ->assertStatus(422);
    }

    public function test_ventas_por_categoria_sin_ningun_parametro_falla(): void
    {
        $this->getJson('/api/order/sales-by-category', $this->authHeaders())
            ->assertStatus(422);
    }

    public function test_ventas_por_categoria_con_mes(): void
    {
        $report = $this->crearReporte();
        $mes = now()->format('Y-m');

        $this->getJson("/api/order/sales-by-category?sistema_id={$report->id}&mes={$mes}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_ventas_por_categoria_solo_con_mes_no_falla(): void
    {
        $mes = now()->format('Y-m');

        $this->getJson("/api/order/sales-by-category?mes={$mes}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_ventas_por_categoria_con_semana(): void
    {
        $report = $this->crearReporte();
        $semana = now()->startOfWeek(Carbon::MONDAY)->toDateString();

        $this->getJson("/api/order/sales-by-category?sistema_id={$report->id}&semana={$semana}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_ventas_por_categoria_solo_con_semana_no_falla(): void
    {
        $semana = now()->startOfWeek(Carbon::MONDAY)->toDateString();

        $this->getJson("/api/order/sales-by-category?semana={$semana}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    private function venderConProducto(int $sistemaId, string $nombreProducto, float $precio, int $cantidad = 1): void
    {
        $product = ProductModel::create([
            ProductModel::NOMBRE => $nombreProducto,
            ProductModel::PRECIO => $precio,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
        ]);

        $this->postJson('/api/order/sale', [
            'sistema_id' => $sistemaId,
            'nombre_pedido' => $nombreProducto,
            'items' => [
                ['producto_id' => $product->id, 'cantidad' => $cantidad, 'precio' => $precio],
            ],
        ], $this->authHeaders())->assertStatus(200);
    }

    public function test_ventas_por_categoria_por_fecha_agrega_todas_las_sesiones_del_dia(): void
    {
        // Bug real: el reporte por fecha (usado en SalesPage) no debe quedar atado a
        // una sola sesión — debe agregar TODAS las sesiones cerradas ese día.
        $sesionA = $this->crearReporte();
        $sesionB = $this->crearReporte();

        $this->venderConProducto($sesionA->id, 'Producto sesión A', 100);
        $this->venderConProducto($sesionB->id, 'Producto sesión B', 50);

        $response = $this->getJson('/api/order/sales-by-category?fecha='.now()->toDateString(), $this->authHeaders())
            ->assertStatus(200);

        $categories = $response->json('data.categories');
        $totalRevenue = collect($categories)->sum('total_revenue');

        // Ambas sesiones caen en la misma categoría (CategoryModel::first()), así que se agregan en una sola fila
        $this->assertEquals(150.0, $totalRevenue);
    }

    public function test_ventas_por_categoria_por_mes_agrega_todas_las_sesiones_del_mes(): void
    {
        $sesionA = $this->crearReporte();
        $sesionB = $this->crearReporte();

        $this->venderConProducto($sesionA->id, 'Producto mes A', 100);
        $this->venderConProducto($sesionB->id, 'Producto mes B', 50);

        $mes = now()->format('Y-m');

        $response = $this->getJson("/api/order/sales-by-category?mes={$mes}", $this->authHeaders())
            ->assertStatus(200);

        $categories = $response->json('data.categories');
        $totalRevenue = collect($categories)->sum('total_revenue');

        $this->assertEquals(150.0, $totalRevenue);
    }

    public function test_ventas_por_categoria_mes_no_incluye_otro_mes(): void
    {
        $sesion = $this->crearReporte();
        $this->venderConProducto($sesion->id, 'Producto fuera de mes', 100);

        $mesPasado = now()->subMonthNoOverflow()->format('Y-m');

        $response = $this->getJson("/api/order/sales-by-category?mes={$mesPasado}", $this->authHeaders())
            ->assertStatus(200);

        $this->assertEmpty($response->json('data.categories'));
    }

    public function test_ventas_por_categoria_fecha_tiene_prioridad_sobre_mes(): void
    {
        $sesion = $this->crearReporte();
        $this->venderConProducto($sesion->id, 'Producto prioridad', 100);

        $hoy = now()->toDateString();
        $mesPasado = now()->subMonthNoOverflow()->format('Y-m');

        // Si vienen ambos, "fecha" (hoy, con ventas) debe ganar sobre "mes" (pasado, vacío).
        $response = $this->getJson(
            "/api/order/sales-by-category?fecha={$hoy}&mes={$mesPasado}",
            $this->authHeaders()
        )->assertStatus(200);

        $totalRevenue = collect($response->json('data.categories'))->sum('total_revenue');
        $this->assertEquals(100.0, $totalRevenue);
    }

    public function test_ventas_por_categoria_por_semana_agrega_todas_las_sesiones_de_la_semana(): void
    {
        $sesionA = $this->crearReporte();
        $sesionB = $this->crearReporte();

        $this->venderConProducto($sesionA->id, 'Producto semana A', 100);
        $this->venderConProducto($sesionB->id, 'Producto semana B', 50);

        $semana = now()->startOfWeek(Carbon::MONDAY)->toDateString();

        $response = $this->getJson("/api/order/sales-by-category?semana={$semana}", $this->authHeaders())
            ->assertStatus(200);

        $totalRevenue = collect($response->json('data.categories'))->sum('total_revenue');
        $this->assertEquals(150.0, $totalRevenue);
    }

    public function test_ventas_por_categoria_semana_no_incluye_otra_semana(): void
    {
        $sesion = $this->crearReporte();
        $this->venderConProducto($sesion->id, 'Producto fuera de semana', 100);

        $semanaPasada = now()->subWeek()->startOfWeek(Carbon::MONDAY)->toDateString();

        $response = $this->getJson("/api/order/sales-by-category?semana={$semanaPasada}", $this->authHeaders())
            ->assertStatus(200);

        $this->assertEmpty($response->json('data.categories'));
    }

    public function test_ventas_por_categoria_fecha_tiene_prioridad_sobre_semana(): void
    {
        $sesion = $this->crearReporte();
        $this->venderConProducto($sesion->id, 'Producto prioridad semana', 100);

        $hoy = now()->toDateString();
        $semanaPasada = now()->subWeek()->startOfWeek(Carbon::MONDAY)->toDateString();

        // Si vienen ambos, "fecha" (hoy, con ventas) debe ganar sobre "semana" (pasada, vacía).
        $response = $this->getJson(
            "/api/order/sales-by-category?fecha={$hoy}&semana={$semanaPasada}",
            $this->authHeaders()
        )->assertStatus(200);

        $totalRevenue = collect($response->json('data.categories'))->sum('total_revenue');
        $this->assertEquals(100.0, $totalRevenue);
    }

    public function test_ventas_por_categoria_semana_tiene_prioridad_sobre_mes(): void
    {
        $sesion = $this->crearReporte();
        $this->venderConProducto($sesion->id, 'Producto prioridad semana-mes', 100);

        $semana = now()->startOfWeek(Carbon::MONDAY)->toDateString();
        $mesPasado = now()->subMonthNoOverflow()->format('Y-m');

        // Si vienen ambos (sin fecha), "semana" (actual, con ventas) debe ganar sobre "mes" (pasado, vacío).
        $response = $this->getJson(
            "/api/order/sales-by-category?semana={$semana}&mes={$mesPasado}",
            $this->authHeaders()
        )->assertStatus(200);

        $totalRevenue = collect($response->json('data.categories'))->sum('total_revenue');
        $this->assertEquals(100.0, $totalRevenue);
    }

    public function test_ventas_por_categoria_domicilios_por_mes(): void
    {
        $sesion = $this->crearReporte();
        $product = ProductModel::create([
            ProductModel::NOMBRE => 'Producto Domicilio Mes',
            ProductModel::PRECIO => 100,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
        ]);

        $this->postJson('/api/order/sale', [
            'sistema_id' => $sesion->id,
            'nombre_pedido' => 'Venta con domicilio',
            'costo_domicilio' => -30,
            'items' => [
                ['producto_id' => $product->id, 'cantidad' => 1, 'precio' => 100],
            ],
        ], $this->authHeaders())->assertStatus(200);

        $mes = now()->format('Y-m');

        $response = $this->getJson("/api/order/sales-by-category?mes={$mes}", $this->authHeaders())
            ->assertStatus(200);

        $this->assertEquals(30.0, $response->json('data.domicilios'));
    }

    public function test_ventas_por_categoria_domicilios_por_semana(): void
    {
        $sesion = $this->crearReporte();
        $product = ProductModel::create([
            ProductModel::NOMBRE => 'Producto Domicilio Semana',
            ProductModel::PRECIO => 100,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
        ]);

        $this->postJson('/api/order/sale', [
            'sistema_id' => $sesion->id,
            'nombre_pedido' => 'Venta con domicilio semana',
            'costo_domicilio' => -30,
            'items' => [
                ['producto_id' => $product->id, 'cantidad' => 1, 'precio' => 100],
            ],
        ], $this->authHeaders())->assertStatus(200);

        $semana = now()->startOfWeek(Carbon::MONDAY)->toDateString();

        $response = $this->getJson("/api/order/sales-by-category?semana={$semana}", $this->authHeaders())
            ->assertStatus(200);

        $this->assertEquals(30.0, $response->json('data.domicilios'));
    }

    public function test_ventas_por_categoria_con_sistema_solo_esa_sesion(): void
    {
        $sesionA = $this->crearReporte();
        $sesionB = $this->crearReporte();

        $this->venderConProducto($sesionA->id, 'Producto solo A', 100);
        $this->venderConProducto($sesionB->id, 'Producto solo B', 999);

        $response = $this->getJson("/api/order/sales-by-category?sistema_id={$sesionA->id}", $this->authHeaders())
            ->assertStatus(200);

        $categories = $response->json('data.categories');
        $totalRevenue = collect($categories)->sum('total_revenue');

        $this->assertEquals(100.0, $totalRevenue);
    }

    // ── CreditCustomers ──────────────────────────────────────

    private function venderACredito(int $sistemaId, CustomerModel $customer, float $total, bool $cerrada = true): OrderModel
    {
        return OrderModel::create([
            OrderModel::TOTAL => $total,
            OrderModel::SUBTOTAL => $total,
            OrderModel::DESCUENTO => 0,
            OrderModel::NOMBRE_PEDIDO => 'Venta a crédito',
            OrderModel::ESTATUS_PEDIDO_ID => $cerrada ? OrderStatusEnum::CLOSED->value : OrderStatusModel::first()->id,
            OrderModel::SISTEMA_ID => $sistemaId,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
            OrderModel::IS_CREDIT => true,
            OrderModel::CUSTOMER_ID => $customer->id,
        ]);
    }

    public function test_clientes_a_credito_sin_sistema_id_falla(): void
    {
        $this->getJson('/api/order/credit-customers', $this->authHeaders())
            ->assertStatus(422);
    }

    public function test_clientes_a_credito_retorna_lista_vacia_sin_ventas(): void
    {
        $report = $this->crearReporte();

        $this->getJson("/api/order/credit-customers?sistema_id={$report->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data', []);
    }

    public function test_clientes_a_credito_agrupa_por_cliente(): void
    {
        $report = $this->crearReporte();
        $customer = CustomerModel::create([
            CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
            CustomerModel::NAME => 'Cliente Fiado',
            CustomerModel::PHONE => '3001234567',
        ]);

        $this->venderACredito($report->id, $customer, 100);
        $this->venderACredito($report->id, $customer, 50);

        $response = $this->getJson("/api/order/credit-customers?sistema_id={$report->id}", $this->authHeaders())
            ->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($customer->id, $data[0]['customer']['id']);
        $this->assertEquals(2, $data[0]['orders_count']);
        $this->assertEquals(150.0, $data[0]['total_credit']);
    }

    public function test_clientes_a_credito_excluye_ordenes_no_cerradas(): void
    {
        $report = $this->crearReporte();
        $customer = CustomerModel::create([
            CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
            CustomerModel::NAME => 'Cliente Sin Cerrar',
        ]);

        $this->venderACredito($report->id, $customer, 100, cerrada: false);

        $this->getJson("/api/order/credit-customers?sistema_id={$report->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data', []);
    }

    public function test_clientes_a_credito_excluye_ventas_no_credito(): void
    {
        $report = $this->crearReporte();
        $orden = $this->crearOrden();
        $orden->update([
            OrderModel::SISTEMA_ID => $report->id,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
        ]);

        $this->getJson("/api/order/credit-customers?sistema_id={$report->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data', []);
    }

    public function test_clientes_a_credito_filtra_por_sesion(): void
    {
        $sesionA = $this->crearReporte();
        $sesionB = $this->crearReporte();
        $customer = CustomerModel::create([
            CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
            CustomerModel::NAME => 'Cliente Multi Sesion',
        ]);

        $this->venderACredito($sesionA->id, $customer, 100);
        $this->venderACredito($sesionB->id, $customer, 999);

        $response = $this->getJson("/api/order/credit-customers?sistema_id={$sesionA->id}", $this->authHeaders())
            ->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals(100.0, $data[0]['total_credit']);
    }

    public function test_clientes_a_credito_sin_autenticacion(): void
    {
        $this->getJson('/api/order/credit-customers?sistema_id=1')
            ->assertStatus(401);
    }

    // ── Auth ─────────────────────────────────────────────────

    public function test_sin_token_no_accede(): void
    {
        $this->getJson('/api/order')->assertStatus(401);
    }
}
