<?php

namespace Tests\System;

use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\ExpenseModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\User;
use Tests\TestCase;

class ExpensesTest extends TestCase
{
    private function crearCaja(float $inicio = 0): MainOrderReportModel
    {
        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => $inicio,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearOrdenCerrada(int $cajaId, float $total): OrderModel
    {
        return OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => 'Orden Test',
            OrderModel::TOTAL => $total,
            OrderModel::SUBTOTAL => $total,
            OrderModel::DESCUENTO => 0,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
            OrderModel::SISTEMA_ID => $cajaId,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearGasto(int $cajaId, array $overrides = []): ExpenseModel
    {
        return ExpenseModel::create(array_merge([
            ExpenseModel::SISTEMA_ID => $cajaId,
            ExpenseModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            ExpenseModel::CONCEPTO => 'Compra de hielo',
            ExpenseModel::MONTO => 50,
            ExpenseModel::TENANT_ID => BusinessConfigModel::first()->id,
        ], $overrides));
    }

    // ── Store ────────────────────────────────────────────────

    public function test_registra_gasto_para_caja_abierta(): void
    {
        $caja = $this->crearCaja();

        $response = $this->postJson("/api/admin/system/{$caja->id}/expense", [
            'concepto' => 'Compra de servilletas',
            'monto' => 75.50,
            'observaciones' => 'Faltaban en almacén',
        ], $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.concepto', 'Compra de servilletas')
            ->assertJsonPath('data.monto', '75.50')
            ->assertJsonPath('data.sistema_id', $caja->id);

        $this->assertDatabaseHas('expenses', [
            'sistema_id' => $caja->id,
            'concepto' => 'Compra de servilletas',
            'monto' => 75.50,
            'tenant_id' => BusinessConfigModel::first()->id,
        ]);
    }

    public function test_gasto_registra_usuario_autenticado(): void
    {
        $caja = $this->crearCaja();
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $response = $this->postJson("/api/admin/system/{$caja->id}/expense", [
            'concepto' => 'Reparación de equipo',
            'monto' => 200,
        ], $this->authHeaders($admin));

        $response->assertStatus(200)
            ->assertJsonPath('data.user_id', $admin->id)
            ->assertJsonPath('data.user.nombre', $admin->nombre);
    }

    public function test_no_registra_gasto_sin_concepto(): void
    {
        $caja = $this->crearCaja();

        $this->postJson("/api/admin/system/{$caja->id}/expense", [
            'monto' => 50,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_registra_gasto_sin_monto(): void
    {
        $caja = $this->crearCaja();

        $this->postJson("/api/admin/system/{$caja->id}/expense", [
            'concepto' => 'Compra de hielo',
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_registra_gasto_con_monto_negativo_o_cero(): void
    {
        $caja = $this->crearCaja();

        $this->postJson("/api/admin/system/{$caja->id}/expense", [
            'concepto' => 'Compra de hielo',
            'monto' => 0,
        ], $this->authHeaders())
            ->assertStatus(400);

        $this->postJson("/api/admin/system/{$caja->id}/expense", [
            'concepto' => 'Compra de hielo',
            'monto' => -10,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_caja_inexistente_retorna_404(): void
    {
        $this->postJson('/api/admin/system/99999/expense', [
            'concepto' => 'Compra de hielo',
            'monto' => 50,
        ], $this->authHeaders())
            ->assertStatus(404);
    }

    // ── Index ────────────────────────────────────────────────

    public function test_lista_gastos_de_la_caja(): void
    {
        $caja = $this->crearCaja();
        $this->crearGasto($caja->id, ['concepto' => 'Hielo', 'monto' => 30]);
        $this->crearGasto($caja->id, ['concepto' => 'Gas', 'monto' => 150]);

        $response = $this->getJson("/api/admin/system/{$caja->id}/expense", $this->authHeaders())
            ->assertStatus(200);

        $conceptos = array_column($response->json('data'), 'concepto');
        $this->assertCount(2, $conceptos);
        $this->assertContains('Hielo', $conceptos);
        $this->assertContains('Gas', $conceptos);
    }

    public function test_lista_gastos_no_incluye_gastos_de_otra_caja(): void
    {
        $cajaA = $this->crearCaja();
        $cajaB = $this->crearCaja();
        $this->crearGasto($cajaA->id, ['concepto' => 'Gasto caja A']);
        $this->crearGasto($cajaB->id, ['concepto' => 'Gasto caja B']);

        $response = $this->getJson("/api/admin/system/{$cajaA->id}/expense", $this->authHeaders())
            ->assertStatus(200);

        $conceptos = array_column($response->json('data'), 'concepto');
        $this->assertContains('Gasto caja A', $conceptos);
        $this->assertNotContains('Gasto caja B', $conceptos);
    }

    // ── Integración con total-current-sales ─────────────────

    public function test_total_current_sales_incluye_gastos(): void
    {
        $caja = $this->crearCaja();
        $this->crearGasto($caja->id, ['monto' => 30]);
        $this->crearGasto($caja->id, ['monto' => 45]);

        $totales = $this->getJson("/api/admin/system/{$caja->id}/total-current-sales", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['bruto', 'domicilios', 'neto', 'propinas', 'gastos', 'by_payment_method']])
            ->json('data');

        $this->assertEquals(75.0, $totales['gastos']);
    }

    public function test_caja_sin_gastos_retorna_cero(): void
    {
        $caja = $this->crearCaja();

        $totales = $this->getJson("/api/admin/system/{$caja->id}/total-current-sales", $this->authHeaders())
            ->assertStatus(200)
            ->json('data');

        $this->assertEquals(0.0, $totales['gastos']);
    }

    // ── Integración con cierre de caja ───────────────────────

    public function test_cierre_caja_resta_gastos_del_efectivo(): void
    {
        $caja = $this->crearCaja(inicio: 100);
        $this->crearOrdenCerrada($caja->id, 300);
        $this->crearGasto($caja->id, ['monto' => 40]);
        $this->crearGasto($caja->id, ['monto' => 20]);

        $this->postJson("/api/admin/system/{$caja->id}/close", [], $this->authHeaders())
            ->assertStatus(200);

        $caja->refresh();

        // efectivo_caja_cierre = inicio(100) + bruto(300) - domicilios(0) - gastos(60) = 340
        $this->assertEquals(340.0, (float) $caja->efectivo_caja_cierre);
    }

    public function test_cierre_caja_sin_gastos_no_afecta_efectivo(): void
    {
        $caja = $this->crearCaja(inicio: 100);
        $this->crearOrdenCerrada($caja->id, 300);

        $this->postJson("/api/admin/system/{$caja->id}/close", [], $this->authHeaders())
            ->assertStatus(200);

        $caja->refresh();

        $this->assertEquals(400.0, (float) $caja->efectivo_caja_cierre);
    }

    // ── Auth ─────────────────────────────────────────────────

    public function test_sin_autenticacion_no_accede_a_index(): void
    {
        $caja = $this->crearCaja();

        $this->getJson("/api/admin/system/{$caja->id}/expense")
            ->assertStatus(401);
    }

    public function test_sin_autenticacion_no_accede_a_store(): void
    {
        $caja = $this->crearCaja();

        $this->postJson("/api/admin/system/{$caja->id}/expense", [
            'concepto' => 'Compra de hielo',
            'monto' => 50,
        ])->assertStatus(401);
    }

    // ── Aislamiento multi-tenant ──────────────────────────────

    public function test_aislamiento_multi_tenant_gastos(): void
    {
        $cajaA = $this->crearCaja();
        $this->crearGasto($cajaA->id, ['concepto' => 'Gasto tenant A']);

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

        $adminB = User::create([
            User::NOMBRE => 'Admin',
            User::APELLIDO_PATERNO => 'B',
            User::APELLIDO_MATERNO => '',
            User::EMAIL => 'admin-b-'.uniqid().'@test.com',
            User::USUARIO => 'admin-b-'.uniqid(),
            User::PASSWORD => bcrypt('password123'),
            User::ROL_ID => RoleEnum::ADMIN->value,
            User::ACTIVO => true,
            User::TENANT_ID => $tenantB->id,
        ]);

        // La caja de tenant A no debe ser visible (ni sus gastos) desde tenant B
        $this->getJson("/api/admin/system/{$cajaA->id}/expense", $this->authHeaders($adminB))
            ->assertStatus(404);

        $this->postJson("/api/admin/system/{$cajaA->id}/expense", [
            'concepto' => 'Intento cross-tenant',
            'monto' => 10,
        ], $this->authHeaders($adminB))
            ->assertStatus(404);
    }
}
