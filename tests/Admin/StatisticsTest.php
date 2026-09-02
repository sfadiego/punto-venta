<?php

namespace Tests\Admin;

use App\Enums\OrderStatusEnum;
use App\Enums\UnidadMedidaEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\ProductModel;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class StatisticsTest extends TestCase
{
    // ── Best seller ───────────────────────────────────────────

    public function test_retorna_top3_sin_filtros(): void
    {
        $this->getJson('/api/admin/system/statistics/best-seller', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['data']);
    }

    public function test_retorna_top3_con_fecha(): void
    {
        $this->getJson(
            '/api/admin/system/statistics/best-seller?date='.now()->format('Y-m'),
            $this->authHeaders()
        )
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_retorna_top3_con_sistema_id(): void
    {
        $caja = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => 'open',
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => 1,
        ]);

        $this->getJson(
            "/api/admin/system/statistics/best-seller?sistema_id={$caja->id}",
            $this->authHeaders()
        )
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_data_es_array(): void
    {
        $response = $this->getJson('/api/admin/system/statistics/best-seller', $this->authHeaders())
            ->assertStatus(200);

        $this->assertIsArray($response->json('data'));
    }

    public function test_sin_autenticacion(): void
    {
        $this->getJson('/api/admin/system/statistics/best-seller')->assertStatus(401);
    }

    public function test_sistema_id_cero_es_ignorado(): void
    {
        // sistema_id=0 → se convierte a null → retorna estadísticas globales
        $this->getJson('/api/admin/system/statistics/best-seller?sistema_id=0', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_producto_vendido_por_litro_redondea_total_a_tres_decimales(): void
    {
        $tenant = BusinessConfigModel::first();
        $caja = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => 'open',
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => 1,
            MainOrderReportModel::TENANT_ID => $tenant->id,
        ]);

        $orden = OrderModel::create([
            OrderModel::TOTAL => 30,
            OrderModel::SUBTOTAL => 30,
            OrderModel::DESCUENTO => 0,
            OrderModel::NOMBRE_PEDIDO => 'Venta litro',
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
            OrderModel::SISTEMA_ID => $caja->id,
            OrderModel::TENANT_ID => $tenant->id,
        ]);

        $producto = ProductModel::create([
            ProductModel::NOMBRE => 'Leche',
            ProductModel::PRECIO => 20,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::UNIDAD_MEDIDA => UnidadMedidaEnum::Litro,
        ]);

        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $producto->id,
            OrderProductModel::CANTIDAD => 1.5,
            OrderProductModel::PRECIO => 20,
            OrderProductModel::DESCUENTO => 0,
        ]);

        $response = $this->getJson('/api/admin/system/statistics/best-seller', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $item = collect($response->json('data'))->firstWhere('id', $producto->id);

        $this->assertNotNull($item, 'El producto vendido por litro debe aparecer en el top de más vendidos.');
        $this->assertSame('litro', $item['unidad_medida']);
        // A diferencia de una unidad discreta (que se castea a entero), un
        // producto por litro conserva decimales — igual que kg/gr.
        $this->assertSame(1.5, $item['total']);
    }

    // ── Average ticket ───────────────────────────────────────

    public function test_average_ticket_sin_ventas_retorna_ceros(): void
    {
        $this->getJson('/api/admin/system/statistics/average-ticket', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total_revenue', 0)
            ->assertJsonPath('data.orders_count', 0)
            ->assertJsonPath('data.average_ticket', 0);
    }

    public function test_average_ticket_calcula_promedio_de_ventas_cerradas(): void
    {
        $tenant = BusinessConfigModel::first();
        $caja = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => 'open',
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => 1,
            MainOrderReportModel::TENANT_ID => $tenant->id,
        ]);

        foreach ([100, 200, 300] as $total) {
            OrderModel::create([
                OrderModel::TOTAL => $total,
                OrderModel::SUBTOTAL => $total,
                OrderModel::DESCUENTO => 0,
                OrderModel::NOMBRE_PEDIDO => 'Venta',
                OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
                OrderModel::SISTEMA_ID => $caja->id,
                OrderModel::TENANT_ID => $tenant->id,
            ]);
        }

        // Orden no cerrada — no debe contarse en el promedio.
        OrderModel::create([
            OrderModel::TOTAL => 900,
            OrderModel::SUBTOTAL => 900,
            OrderModel::DESCUENTO => 0,
            OrderModel::NOMBRE_PEDIDO => 'Venta abierta',
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::IN_PROCESS->value,
            OrderModel::SISTEMA_ID => $caja->id,
            OrderModel::TENANT_ID => $tenant->id,
        ]);

        $this->getJson('/api/admin/system/statistics/average-ticket', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total_revenue', 600)
            ->assertJsonPath('data.orders_count', 3)
            ->assertJsonPath('data.average_ticket', 200);
    }

    public function test_average_ticket_con_fecha_filtra_por_mes(): void
    {
        $tenant = BusinessConfigModel::first();
        $caja = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => 'open',
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => 1,
            MainOrderReportModel::TENANT_ID => $tenant->id,
        ]);

        $orden = OrderModel::create([
            OrderModel::TOTAL => 500,
            OrderModel::SUBTOTAL => 500,
            OrderModel::DESCUENTO => 0,
            OrderModel::NOMBRE_PEDIDO => 'Venta mes pasado',
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
            OrderModel::SISTEMA_ID => $caja->id,
            OrderModel::TENANT_ID => $tenant->id,
        ]);
        // Eloquent no permite mass-assign de created_at (no está en $fillable) — se
        // actualiza directo por query builder para simular una orden del mes pasado.
        DB::table('order')->where('id', $orden->id)->update(['created_at' => now()->subMonthNoOverflow()]);

        $this->getJson(
            '/api/admin/system/statistics/average-ticket?date='.now()->format('Y-m'),
            $this->authHeaders()
        )
            ->assertStatus(200)
            ->assertJsonPath('data.orders_count', 0);
    }

    public function test_average_ticket_sin_autenticacion(): void
    {
        $this->getJson('/api/admin/system/statistics/average-ticket')->assertStatus(401);
    }

    public function test_average_ticket_incluye_ventas_de_las_primeras_horas_del_mes(): void
    {
        // Regresión: monthRange() convertía el rango a UTC antes de compararlo contra
        // created_at (guardado en hora local, America/Mexico_City) — una venta a las 2am
        // del día 1 quedaba fuera del rango porque el inicio de mes se corría a las 6am.
        $tenant = BusinessConfigModel::first();
        $caja = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => 'open',
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => 1,
            MainOrderReportModel::TENANT_ID => $tenant->id,
        ]);

        $orden = OrderModel::create([
            OrderModel::TOTAL => 150,
            OrderModel::SUBTOTAL => 150,
            OrderModel::DESCUENTO => 0,
            OrderModel::NOMBRE_PEDIDO => 'Venta madrugada inicio de mes',
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
            OrderModel::SISTEMA_ID => $caja->id,
            OrderModel::TENANT_ID => $tenant->id,
        ]);
        DB::table('order')->where('id', $orden->id)->update([
            'created_at' => now()->startOfMonth()->addHours(2),
        ]);

        $this->getJson(
            '/api/admin/system/statistics/average-ticket?date='.now()->format('Y-m'),
            $this->authHeaders()
        )
            ->assertStatus(200)
            ->assertJsonPath('data.orders_count', 1)
            ->assertJsonPath('data.total_revenue', 150);
    }
}
