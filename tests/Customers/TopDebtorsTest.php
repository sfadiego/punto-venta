<?php

namespace Tests\Customers;

use App\Enums\BusinessTypeEnum;
use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\CustomerChargeModel;
use App\Models\CustomerModel;
use App\Models\CustomerPaymentModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\Permission;
use App\Models\RolePermission;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Estadísticas › clientes con más adeudo (GET /api/admin/system/statistics/top-debtors): top 10 por
 * saldo, con qué parte del total pesa cada uno y cuánto lleva sin abonar. Solo retail y venta por peso.
 */
class TopDebtorsTest extends TestCase
{
    private const URL = '/api/admin/system/statistics/top-debtors';

    protected function setUp(): void
    {
        parent::setUp();

        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail->value]);
        CustomerModel::query()->delete();
    }

    private function crearCliente(string $nombre, float $balance, ?int $tenantId = null): CustomerModel
    {
        return CustomerModel::create([
            CustomerModel::NAME => $nombre,
            CustomerModel::PHONE => '5512345678',
            CustomerModel::BALANCE => $balance,
            CustomerModel::TENANT_ID => $tenantId ?? BusinessConfigModel::first()->id,
        ]);
    }

    private function abonoHace(CustomerModel $customer, int $days): void
    {
        $payment = CustomerPaymentModel::create([
            CustomerPaymentModel::CUSTOMER_ID => $customer->id,
            CustomerPaymentModel::AMOUNT => 10,
            CustomerPaymentModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
        DB::table('customer_payments')->where('id', $payment->id)->update(['created_at' => Carbon::today()->subDays($days)->setTime(10, 0)]);
    }

    private function cargoHace(CustomerModel $customer, int $days): void
    {
        $charge = CustomerChargeModel::create([
            CustomerChargeModel::CUSTOMER_ID => $customer->id,
            CustomerChargeModel::AMOUNT => 100,
            CustomerChargeModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
        DB::table('customer_charges')->where('id', $charge->id)->update(['created_at' => Carbon::today()->subDays($days)->setTime(10, 0)]);
    }

    private function top()
    {
        return $this->getJson(self::URL, $this->authHeaders())->assertStatus(200);
    }

    private function cajaAbierta(): MainOrderReportModel
    {
        return MainOrderReportModel::firstOrCreate([MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN], [
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function apartadoDe(CustomerModel $customer, float $total, float $abonado, int $venceEnDias, OrderStatusEnum $estatus = OrderStatusEnum::LAYAWAY): void
    {
        OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => 'Apartado',
            OrderModel::TOTAL => $total,
            OrderModel::SUBTOTAL => $total,
            OrderModel::DESCUENTO => 0,
            OrderModel::ESTATUS_PEDIDO_ID => $estatus->value,
            OrderModel::SISTEMA_ID => $this->cajaAbierta()->id,
            OrderModel::CUSTOMER_ID => $customer->id,
            OrderModel::AMOUNT_PAID => $abonado,
            OrderModel::LAYAWAY_DUE_DATE => Carbon::today()->addDays($venceEnDias)->toDateString(),
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    public function test_cada_deudor_indica_sus_apartados_activos_aparte_del_adeudo(): void
    {
        $conApartados = $this->crearCliente('Con apartados', 500);
        $this->crearCliente('Sin apartados', 100);
        $this->apartadoDe($conApartados, 1000, 300, 5);
        $this->apartadoDe($conApartados, 400, 100, -2);
        // Un apartado ya liquidado no cuenta como activo.
        $this->apartadoDe($conApartados, 900, 900, -10, OrderStatusEnum::CLOSED);

        $rows = collect($this->top()->json('data.rows'))->keyBy('name');

        $this->assertSame(2, $rows['Con apartados']['layaway_count']);
        $this->assertEquals(1400, $rows['Con apartados']['layaway_total']);
        $this->assertEquals(400, $rows['Con apartados']['layaway_paid']);
        $this->assertSame(1, $rows['Con apartados']['layaway_overdue_count']);
        $this->assertSame(0, $rows['Sin apartados']['layaway_count']);
        // El apartado no es adeudo: el saldo del cliente no cambia.
        $this->assertEquals(500, $rows['Con apartados']['balance']);
    }

    public function test_lista_el_top_por_adeudo_con_su_porcentaje_del_total(): void
    {
        $this->crearCliente('Chico', 100);
        $this->crearCliente('Grande', 600);
        $this->crearCliente('Mediano', 300);

        $response = $this->top();

        $this->assertSame(['Grande', 'Mediano', 'Chico'], collect($response->json('data.rows'))->pluck('name')->all());
        $this->assertEquals([60.0, 30.0, 10.0], collect($response->json('data.rows'))->pluck('share_percent')->all());
        $response->assertJsonPath('data.summary.total_balance', 1000)
            ->assertJsonPath('data.summary.debtors_count', 3);
    }

    public function test_solo_cuentan_clientes_con_adeudo_positivo(): void
    {
        $this->crearCliente('Debe', 200);
        $this->crearCliente('Al dia', 0);
        $this->crearCliente('Saldo a favor', -50);

        $response = $this->top();

        $this->assertSame(['Debe'], collect($response->json('data.rows'))->pluck('name')->all());
        $response->assertJsonPath('data.summary.debtors_count', 1);
    }

    public function test_el_top_se_limita_a_10_pero_el_resumen_cuenta_a_todos(): void
    {
        for ($i = 1; $i <= 12; $i++) {
            $this->crearCliente("Cliente {$i}", 100 * $i);
        }

        $response = $this->top();

        $this->assertCount(10, $response->json('data.rows'));
        $this->assertSame('Cliente 12', $response->json('data.rows.0.name'));
        $response->assertJsonPath('data.summary.debtors_count', 12)
            ->assertJsonPath('data.summary.total_balance', 7800);
    }

    public function test_dias_sin_abonar_se_cuentan_desde_el_ultimo_abono(): void
    {
        $cliente = $this->crearCliente('Abonador', 500);
        $this->abonoHace($cliente, 40);
        $this->abonoHace($cliente, 12);

        $row = $this->top()->json('data.rows.0');

        $this->assertSame(12, $row['days_without_payment']);
        $this->assertSame(Carbon::today()->subDays(12)->toDateString(), Carbon::parse($row['last_payment_at'])->toDateString());
    }

    public function test_si_nunca_ha_abonado_se_cuenta_desde_su_primer_cargo(): void
    {
        $cliente = $this->crearCliente('Sin abonos', 500);
        $this->cargoHace($cliente, 25);
        $this->cargoHace($cliente, 5);

        $row = $this->top()->json('data.rows.0');

        $this->assertNull($row['last_payment_at']);
        $this->assertSame(25, $row['days_without_payment']);
    }

    public function test_cliente_sin_abonos_ni_cargos_registrados_no_tiene_dias(): void
    {
        $this->crearCliente('Saldo inicial', 500);

        $this->assertNull($this->top()->json('data.rows.0.days_without_payment'));
    }

    public function test_no_incluye_clientes_de_otros_tenants(): void
    {
        $tenantB = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'tenant-b-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Tenant B',
            BusinessConfigModel::PRIMARY_COLOR => '#F59E0B',
            BusinessConfigModel::SIDEBAR_COLOR => '#1C1917',
            BusinessConfigModel::FONT_COLOR => '#FFFFFF',
            BusinessConfigModel::LABEL_COLOR => '#1C1917',
            BusinessConfigModel::SUBSCRIPTION_PLAN => 'lifetime',
        ]);
        $this->crearCliente('Propio', 100);
        $this->crearCliente('Ajeno', 9999, $tenantB->id);

        $response = $this->top();

        $this->assertSame(['Propio'], collect($response->json('data.rows'))->pluck('name')->all());
        $response->assertJsonPath('data.summary.total_balance', 100);
    }

    public function test_sin_clientes_con_adeudo_devuelve_vacio_y_ceros(): void
    {
        $this->top()
            ->assertJsonPath('data.rows', [])
            ->assertJsonPath('data.summary.total_balance', 0)
            ->assertJsonPath('data.summary.debtors_count', 0);
    }

    // ── Resumen para la página de Clientes ────────────────────

    public function test_resumen_de_clientes_devuelve_los_totales_sin_el_detalle_del_top(): void
    {
        for ($i = 1; $i <= 12; $i++) {
            $this->crearCliente("Cliente {$i}", 100 * $i);
        }
        $this->crearCliente('Al dia', 0);

        $this->getJson('/api/customer/debt-summary', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total_balance', 7800)
            ->assertJsonPath('data.debtors_count', 12)
            ->assertJsonMissingPath('data.rows');
    }

    public function test_el_resumen_de_clientes_esta_disponible_en_cualquier_tipo_de_negocio_y_es_del_tenant(): void
    {
        // Sin autenticar primero: el guard de Sanctum cachea al usuario de authHeaders() dentro del test.
        $this->getJson('/api/customer/debt-summary')->assertStatus(401);

        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante->value]);
        $this->crearCliente('Propio', 150);

        $this->getJson('/api/customer/debt-summary', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total_balance', 150)
            ->assertJsonPath('data.debtors_count', 1);
    }

    // ── Tipo de negocio y permisos ───────────────────────────

    public function test_venta_por_peso_tambien_puede_verlo(): void
    {
        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::VentaPorPeso->value]);

        $this->top();
    }

    public function test_otros_tipos_de_negocio_reciben_403(): void
    {
        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante->value]);

        $this->getJson(self::URL, $this->authHeaders())->assertStatus(403);
    }

    public function test_exige_el_permiso_view_statistics(): void
    {
        $empleado = User::factory()->create([User::ROL_ID => RoleEnum::EMPLOYE->value, User::TENANT_ID => BusinessConfigModel::first()->id]);
        $this->getJson(self::URL)->assertStatus(401);

        // Configurado con otro permiso, para no caer en el fallback a DEFAULTS.
        foreach (['viewOrders'] as $key) {
            RolePermission::create([
                RolePermission::TENANT_ID => BusinessConfigModel::first()->id,
                RolePermission::ROLE_ID => RoleEnum::EMPLOYE->value,
                RolePermission::PERMISSION_ID => Permission::where(Permission::KEY, $key)->firstOrFail()->id,
            ]);
        }
        $this->getJson(self::URL, $this->authHeaders($empleado))->assertStatus(403);

        RolePermission::create([
            RolePermission::TENANT_ID => BusinessConfigModel::first()->id,
            RolePermission::ROLE_ID => RoleEnum::EMPLOYE->value,
            RolePermission::PERMISSION_ID => Permission::where(Permission::KEY, 'viewStatistics')->firstOrFail()->id,
        ]);
        $this->getJson(self::URL, $this->authHeaders($empleado))->assertStatus(200);
    }

    // ── Exportación (CSV) ──────────────────────────────────

    private function exportar(?User $user = null)
    {
        return $this->getJson(self::URL.'/export', $this->authHeaders($user));
    }

    /** @return array<int, array<int, string|null>> filas del CSV (sin BOM), encabezado incluido */
    private function csvRows($response): array
    {
        $content = preg_replace('/^\xEF\xBB\xBF/', '', $response->streamedContent());

        return array_map('str_getcsv', array_filter(explode("\n", $content), fn (string $line): bool => $line !== ''));
    }

    public function test_exporta_toda_la_cartera_no_solo_el_top_10(): void
    {
        for ($i = 1; $i <= 12; $i++) {
            $this->crearCliente("Cliente {$i}", 100 * $i);
        }
        $this->crearCliente('Al dia', 0);

        $response = $this->exportar()->assertStatus(200);
        $rows = $this->csvRows($response);

        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('.csv', $response->headers->get('Content-Disposition'));
        $this->assertSame(['Cliente', 'Teléfono', 'Adeudo', '% de la cartera', 'Último abono', 'Días sin abonar'], $rows[0]);
        // Encabezado + los 12 deudores (el que está al día no aparece), de mayor a menor.
        $this->assertCount(13, $rows);
        $this->assertSame('Cliente 12', $rows[1][0]);
        $this->assertSame('Cliente 1', $rows[12][0]);
    }

    public function test_el_csv_trae_porcentaje_ultimo_abono_y_dias_sin_abonar(): void
    {
        $cliente = $this->crearCliente('Grande', 600);
        $this->crearCliente('Chico', 400);
        $this->abonoHace($cliente, 5);

        $rows = $this->csvRows($this->exportar()->assertStatus(200));

        $this->assertSame('Grande', $rows[1][0]);
        $this->assertEquals(600, $rows[1][2]);
        $this->assertEquals(60, $rows[1][3]);
        $this->assertSame(Carbon::today()->subDays(5)->toDateString(), $rows[1][4]);
        $this->assertEquals(5, $rows[1][5]);
        // Quien nunca ha abonado lo indica.
        $this->assertSame('Nunca', $rows[2][4]);
    }

    public function test_la_exportacion_neutraliza_formulas_en_csv(): void
    {
        $this->crearCliente('=HYPERLINK("http://x")', 100);

        $rows = $this->csvRows($this->exportar()->assertStatus(200));

        $this->assertSame('\'=HYPERLINK("http://x")', $rows[1][0]);
    }

    public function test_la_exportacion_solo_incluye_clientes_del_tenant(): void
    {
        $this->crearCliente('Propio', 100);
        $tenantB = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'tenant-b-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Tenant B',
            BusinessConfigModel::PRIMARY_COLOR => '#F59E0B',
            BusinessConfigModel::SIDEBAR_COLOR => '#1C1917',
            BusinessConfigModel::FONT_COLOR => '#FFFFFF',
            BusinessConfigModel::LABEL_COLOR => '#1C1917',
            BusinessConfigModel::SUBSCRIPTION_PLAN => 'lifetime',
        ]);
        $this->crearCliente('Ajeno', 900, $tenantB->id);

        $rows = $this->csvRows($this->exportar()->assertStatus(200));

        $this->assertSame(['Propio'], array_column(array_slice($rows, 1), 0));
    }

    public function test_la_exportacion_respeta_tipo_de_negocio_y_permiso(): void
    {
        $this->getJson(self::URL.'/export')->assertStatus(401);

        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante->value]);
        $this->exportar()->assertStatus(403);
        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::VentaPorPeso->value]);
        $this->exportar()->assertStatus(200);

        $empleado = User::factory()->create([User::ROL_ID => RoleEnum::EMPLOYE->value, User::TENANT_ID => BusinessConfigModel::first()->id]);
        // Configurado con otro permiso, para no caer en el fallback a DEFAULTS.
        RolePermission::create([
            RolePermission::TENANT_ID => BusinessConfigModel::first()->id,
            RolePermission::ROLE_ID => RoleEnum::EMPLOYE->value,
            RolePermission::PERMISSION_ID => Permission::where(Permission::KEY, 'viewOrders')->firstOrFail()->id,
        ]);
        $this->exportar($empleado)->assertStatus(403);

        RolePermission::create([
            RolePermission::TENANT_ID => BusinessConfigModel::first()->id,
            RolePermission::ROLE_ID => RoleEnum::EMPLOYE->value,
            RolePermission::PERMISSION_ID => Permission::where(Permission::KEY, 'viewStatistics')->firstOrFail()->id,
        ]);
        $this->exportar($empleado)->assertStatus(200);
    }
}
