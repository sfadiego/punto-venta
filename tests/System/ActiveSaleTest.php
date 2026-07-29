<?php

namespace Tests\System;

use App\Enums\MainOrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\MainOrderReportModel;
use App\Models\User;
use Tests\TestCase;

class ActiveSaleTest extends TestCase
{
    private function crearCajaAbierta(): MainOrderReportModel
    {
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 500.00,
            MainOrderReportModel::OBSERVACION => '',
            MainOrderReportModel::USER_ID => $user->id,
        ]);
    }

    public function test_retorna_null_cuando_no_hay_caja_abierta(): void
    {
        $this->getJson('/api/admin/system/active-sale', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data', null);
    }

    public function test_retorna_caja_activa_cuando_existe(): void
    {
        $caja = $this->crearCajaAbierta();

        $this->getJson('/api/admin/system/active-sale', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.id', $caja->id)
            ->assertJsonStructure(['data' => ['id', 'estatus_caja', 'user']]);
    }

    public function test_sin_autenticacion_retorna_401(): void
    {
        $this->getJson('/api/admin/system/active-sale')
            ->assertStatus(401);
    }

    // ── Show ─────────────────────────────────────────────────

    public function test_show_retorna_caja_por_id(): void
    {
        $caja = $this->crearCajaAbierta();

        $this->getJson("/api/admin/system/{$caja->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.id', $caja->id)
            ->assertJsonStructure(['data' => ['id', 'estatus_caja', 'user']]);
    }

    public function test_show_caja_inexistente_retorna_404(): void
    {
        $this->getJson('/api/admin/system/99999', $this->authHeaders())
            ->assertStatus(404);
    }

    public function test_show_sin_autenticacion_retorna_401(): void
    {
        $caja = $this->crearCajaAbierta();

        $this->getJson("/api/admin/system/{$caja->id}")
            ->assertStatus(401);
    }

    public function test_show_no_expone_caja_de_otro_tenant(): void
    {
        $caja = $this->crearCajaAbierta();

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

        $this->getJson("/api/admin/system/{$caja->id}", $this->authHeaders($adminB))
            ->assertStatus(404);
    }

    // ── Open ─────────────────────────────────────────────────

    public function test_abre_caja_exitosamente(): void
    {
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $response = $this->postJson('/api/admin/system/open', [
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 500,
            MainOrderReportModel::USER_ID => $user->id,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.estatus_caja', MainOrderStatusEnum::OPEN->value);

        $this->assertDatabaseHas('main_order_report', [
            'id' => $response->json('data.id'),
            'efectivo_caja_inicio' => 500,
            'estatus_caja' => MainOrderStatusEnum::OPEN->value,
        ]);
    }

    public function test_abre_caja_con_observaciones(): void
    {
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->postJson('/api/admin/system/open', [
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 300,
            MainOrderReportModel::USER_ID => $user->id,
            MainOrderReportModel::OBSERVACION => 'Turno de la mañana',
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.observaciones', 'Turno de la mañana');
    }

    public function test_no_abre_caja_si_ya_hay_una_activa(): void
    {
        $this->crearCajaAbierta();
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->postJson('/api/admin/system/open', [
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 500,
            MainOrderReportModel::USER_ID => $user->id,
        ], $this->authHeaders())
            ->assertStatus(422);
    }

    public function test_abrir_caja_requiere_efectivo_inicio(): void
    {
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->postJson('/api/admin/system/open', [
            MainOrderReportModel::USER_ID => $user->id,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_abrir_caja_requiere_user_id_valido(): void
    {
        $this->postJson('/api/admin/system/open', [
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 500,
            MainOrderReportModel::USER_ID => 99999,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_abrir_caja_sin_autenticacion_retorna_401(): void
    {
        $this->postJson('/api/admin/system/open', [
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 500,
            MainOrderReportModel::USER_ID => 1,
        ])->assertStatus(401);
    }
}
