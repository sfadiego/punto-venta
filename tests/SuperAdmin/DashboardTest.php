<?php

namespace Tests\SuperAdmin;

use App\Enums\BusinessNicheEnum;
use App\Enums\ClientLeadStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\ClientLeadModel;
use App\Models\ErrorReporting;
use App\Models\User;
use Carbon\Carbon;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    private function superAdminHeaders(): array
    {
        $user = User::where('rol_id', RoleEnum::SUPERADMIN->value)->first();

        return $this->authHeaders($user);
    }

    public function test_devuelve_resumen_con_estructura_esperada(): void
    {
        $this->getJson('/api/super-admin/dashboard', $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure([
                'data' => [
                    'tenants' => ['active', 'demo', 'inactive'],
                    'active_users_now',
                    'mrr',
                    'errors_last_24h' => ['total', 'backend', 'frontend'],
                    'recent_errors',
                    'expiring_subscriptions',
                    'stale_tenants',
                    'client_leads' => ['follow_up', 'customer', 'discarded'],
                    'feature_adoption' => ['multi_branch', 'printer', 'stock', 'customers'],
                ],
            ]);
    }

    public function test_cuenta_tenants_por_estatus(): void
    {
        BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'activo-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Activo',
        ]);
        BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'demo-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Demo',
        ]);
        BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'inactivo-'.uniqid(),
            BusinessConfigModel::ACTIVO => false,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Inactivo',
        ]);

        $response = $this->getJson('/api/super-admin/dashboard', $this->superAdminHeaders())
            ->assertStatus(200);

        $tenants = $response->json('data.tenants');
        $this->assertGreaterThanOrEqual(1, $tenants['active']);
        $this->assertGreaterThanOrEqual(1, $tenants['demo']);
        $this->assertGreaterThanOrEqual(1, $tenants['inactive']);
    }

    public function test_incluye_suscripcion_por_vencer_en_los_proximos_7_dias(): void
    {
        $tenant = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'vence-pronto-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::BUSINESS_NAME => 'Vence Pronto',
            BusinessConfigModel::SUBSCRIPTION_EXPIRES_AT => Carbon::today()->addDays(3),
        ]);

        $response = $this->getJson('/api/super-admin/dashboard', $this->superAdminHeaders())
            ->assertStatus(200);

        $ids = collect($response->json('data.expiring_subscriptions'))->pluck('id');
        $this->assertTrue($ids->contains($tenant->id));
    }

    public function test_excluye_suscripcion_fuera_de_la_ventana(): void
    {
        $tenant = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'vence-lejos-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::BUSINESS_NAME => 'Vence Lejos',
            BusinessConfigModel::SUBSCRIPTION_EXPIRES_AT => Carbon::today()->addDays(30),
        ]);

        $response = $this->getJson('/api/super-admin/dashboard', $this->superAdminHeaders())
            ->assertStatus(200);

        $ids = collect($response->json('data.expiring_subscriptions'))->pluck('id');
        $this->assertFalse($ids->contains($tenant->id));
    }

    public function test_incluye_errores_recientes(): void
    {
        ErrorReporting::create([
            'source' => 'backend',
            'endpoint' => '/api/order/1',
            'method' => 'POST',
            'status_code' => 500,
            'error_message' => 'Error de prueba',
            'created_at' => now(),
        ]);

        $response = $this->getJson('/api/super-admin/dashboard', $this->superAdminHeaders())
            ->assertStatus(200);

        $messages = collect($response->json('data.recent_errors'))->pluck('error_message');
        $this->assertTrue($messages->contains('Error de prueba'));
        $this->assertGreaterThanOrEqual(1, $response->json('data.errors_last_24h.total'));
    }

    public function test_cuenta_leads_por_estatus(): void
    {
        ClientLeadModel::create([
            ClientLeadModel::BUSINESS_NAME => 'Lead Seguimiento',
            ClientLeadModel::EMAIL => 'lead-'.uniqid().'@test.com',
            ClientLeadModel::PHONE => '5512345678',
            ClientLeadModel::BUSINESS_NICHE => BusinessNicheEnum::Otro->value,
            ClientLeadModel::STATUS => ClientLeadStatusEnum::FollowUp->value,
        ]);

        $response = $this->getJson('/api/super-admin/dashboard', $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertGreaterThanOrEqual(1, $response->json('data.client_leads.follow_up'));
    }

    public function test_sin_autenticacion_no_accede(): void
    {
        $this->getJson('/api/super-admin/dashboard')->assertStatus(401);
    }

    public function test_sin_rol_superadmin_no_accede(): void
    {
        $this->getJson('/api/super-admin/dashboard', $this->authHeaders())->assertStatus(403);
    }
}
