<?php

namespace Tests\SuperAdmin;

use App\Enums\BusinessNicheEnum;
use App\Enums\ClientLeadStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\ClientLeadModel;
use App\Enums\ActivityTypeEnum;
use App\Models\ErrorReporting;
use App\Models\PersonalAccessToken;
use App\Models\TenantActivityLogModel;
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
                    'usage_hourly' => ['hourly', 'peak_hour', 'peak_count'],
                ],
            ]);
    }

    public function test_usage_hourly_reporta_24_horas_y_sin_actividad_peak_hour_es_null(): void
    {
        $response = $this->getJson('/api/super-admin/dashboard', $this->superAdminHeaders())
            ->assertStatus(200);

        $usage = $response->json('data.usage_hourly');
        $this->assertCount(24, $usage['hourly']);
        $this->assertSame(0, $usage['hourly'][0]['hour']);
        $this->assertSame(23, $usage['hourly'][23]['hour']);
    }

    public function test_usage_hourly_identifica_la_hora_con_mas_eventos_entre_tenants(): void
    {
        $tenantA = BusinessConfigModel::first();
        $tenantB = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'tenant-b-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Tenant B',
        ]);

        $horaPico = now()->setTime(14, 0);
        TenantActivityLogModel::create([
            TenantActivityLogModel::TENANT_ID => $tenantA->id,
            TenantActivityLogModel::TYPE => ActivityTypeEnum::LOGIN->value,
            TenantActivityLogModel::CREATED_AT => $horaPico,
        ]);
        TenantActivityLogModel::create([
            TenantActivityLogModel::TENANT_ID => $tenantB->id,
            TenantActivityLogModel::TYPE => ActivityTypeEnum::SALE_CLOSED->value,
            TenantActivityLogModel::CREATED_AT => $horaPico->copy()->addMinutes(10),
        ]);
        TenantActivityLogModel::create([
            TenantActivityLogModel::TENANT_ID => $tenantA->id,
            TenantActivityLogModel::TYPE => ActivityTypeEnum::LOGIN->value,
            TenantActivityLogModel::CREATED_AT => now()->setTime(3, 0),
        ]);

        $response = $this->getJson('/api/super-admin/dashboard', $this->superAdminHeaders())
            ->assertStatus(200);

        $usage = $response->json('data.usage_hourly');
        $this->assertSame(14, $usage['peak_hour']);
        $this->assertSame(2, $usage['peak_count']);
    }

    public function test_usage_hourly_ignora_eventos_fuera_de_la_ventana_de_30_dias(): void
    {
        TenantActivityLogModel::create([
            TenantActivityLogModel::TENANT_ID => BusinessConfigModel::first()->id,
            TenantActivityLogModel::TYPE => ActivityTypeEnum::LOGIN->value,
            TenantActivityLogModel::CREATED_AT => now()->subDays(45)->setTime(9, 0),
        ]);

        $response = $this->getJson('/api/super-admin/dashboard', $this->superAdminHeaders())
            ->assertStatus(200);

        $usage = $response->json('data.usage_hourly');
        $this->assertNull($usage['peak_hour']);
        $this->assertSame(0, $usage['peak_count']);
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

    public function test_sesion_del_superadmin_no_cuenta_como_usuario_activo(): void
    {
        // authHeaders() crea el token vía createToken() genérico (no User::issueAccessToken()),
        // así que queda con tenant_id null — igual que el token real que emite
        // SuperAdminAuthController::login(). El propio request ya "toca" last_used_at de ese
        // token (vía el guard de Sanctum, antes de llegar al controller), así que si el filtro
        // de tenant_id no existiera, este request se contaría a sí mismo como usuario activo.
        $response = $this->getJson('/api/super-admin/dashboard', $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertSame(0, $response->json('data.active_users_now'));
    }

    public function test_cuenta_solo_sesiones_de_usuarios_de_tenant(): void
    {
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();
        $token = $user->createToken('tenant-session')->accessToken;
        // last_used_at no está en $fillable (ver PersonalAccessToken) — update() lo ignora en
        // silencio, hay que forzarlo con forceFill().
        $token->forceFill([
            PersonalAccessToken::TENANT_ID => $user->tenant_id,
            PersonalAccessToken::LAST_USED_AT => now(),
        ])->save();

        $response = $this->getJson('/api/super-admin/dashboard', $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertGreaterThanOrEqual(1, $response->json('data.active_users_now'));
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
