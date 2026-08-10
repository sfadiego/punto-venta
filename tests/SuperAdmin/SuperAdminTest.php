<?php

namespace Tests\SuperAdmin;

use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\User;
use Tests\TestCase;

class SuperAdminTest extends TestCase
{
    private function superAdminHeaders(): array
    {
        $user = User::where('rol_id', RoleEnum::SUPERADMIN->value)->first();

        return $this->authHeaders($user);
    }

    // ── Auth ──────────────────────────────────────────────────

    public function test_superadmin_login_exitoso(): void
    {
        $this->postJson('/api/super-admin/auth/login', [
            'email' => env('APP_SUPER_ADMIN_EMAIL'),
            'password' => env('APP_SUPER_ADMIN_PASSWORD'),
        ])
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['data' => ['access_token', 'user']]);
    }

    public function test_login_con_credenciales_invalidas(): void
    {
        $this->postJson('/api/super-admin/auth/login', [
            'email' => env('APP_SUPER_ADMIN_EMAIL'),
            'password' => 'wrong_password',
        ])->assertStatus(422);
    }

    public function test_login_sin_campos_requeridos(): void
    {
        $this->postJson('/api/super-admin/auth/login', [])
            ->assertStatus(400);
    }

    public function test_login_bloquea_tras_superar_el_limite_de_intentos(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/super-admin/auth/login', [
                'email' => env('APP_SUPER_ADMIN_EMAIL'),
                'password' => 'wrong_password',
            ])->assertStatus(422);
        }

        // 6to intento en el mismo minuto → bloqueado por el rate limiter
        $this->postJson('/api/super-admin/auth/login', [
            'email' => env('APP_SUPER_ADMIN_EMAIL'),
            'password' => 'wrong_password',
        ])->assertStatus(429);
    }

    // ── Settings ──────────────────────────────────────────────

    public function test_obtiene_settings(): void
    {
        $this->getJson('/api/super-admin/settings', $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['data' => ['logo_upload_enabled']]);
    }

    public function test_settings_sin_autenticacion(): void
    {
        $this->getJson('/api/super-admin/settings')
            ->assertStatus(401);
    }

    public function test_settings_sin_rol_superadmin(): void
    {
        $this->getJson('/api/super-admin/settings', $this->authHeaders())
            ->assertStatus(403);
    }

    public function test_actualiza_setting(): void
    {
        $this->putJson('/api/super-admin/settings', [
            'logo_upload_enabled' => true,
        ], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.logo_upload_enabled', true);
    }

    public function test_actualiza_setting_sin_autenticacion(): void
    {
        $this->putJson('/api/super-admin/settings', ['logo_upload_enabled' => true])
            ->assertStatus(401);
    }

    public function test_actualiza_setting_sin_campos_requeridos(): void
    {
        // Todos los campos son "sometimes" → body vacío es válido y retorna 200
        $this->putJson('/api/super-admin/settings', [], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_settings_incluye_theme_por_defecto(): void
    {
        $this->getJson('/api/super-admin/settings', $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.theme', 'amber_orange');
    }

    public function test_actualiza_theme(): void
    {
        $this->putJson('/api/super-admin/settings', [
            'theme' => 'azul_marino',
        ], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.theme', 'azul_marino');
    }

    public function test_actualiza_theme_invalido_falla(): void
    {
        $this->putJson('/api/super-admin/settings', [
            'theme' => 'no_existe',
        ], $this->superAdminHeaders())
            ->assertStatus(400);
    }

    // ── Public app theme ──────────────────────────────────────

    public function test_app_theme_publico_retorna_default(): void
    {
        $this->getJson('/api/app-theme')
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.theme', 'amber_orange')
            ->assertJsonMissingPath('data.payment_info');
    }

    public function test_app_theme_publico_refleja_cambio(): void
    {
        $this->putJson('/api/super-admin/settings', [
            'theme' => 'azul_marino',
        ], $this->superAdminHeaders())->assertStatus(200);

        $this->getJson('/api/app-theme')
            ->assertStatus(200)
            ->assertJsonPath('data.theme', 'azul_marino');
    }

    // ── Subscription index ────────────────────────────────────

    public function test_lista_tenants_con_suscripciones(): void
    {
        $this->getJson('/api/super-admin/subscription', $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['data' => [['id', 'business_name', 'subscription_status']]]);
    }

    public function test_lista_suscripciones_sin_autenticacion(): void
    {
        $this->getJson('/api/super-admin/subscription')
            ->assertStatus(401);
    }

    // ── Subscription store ────────────────────────────────────

    public function test_crea_suscripcion_para_tenant(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->postJson("/api/super-admin/subscription/{$tenant->id}", [
            'plan' => 'monthly',
            'starts_at' => now()->toDateString(),
            'amount' => 150.00,
        ], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.id', $tenant->id);
    }

    public function test_crea_suscripcion_sin_campos_requeridos(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->postJson("/api/super-admin/subscription/{$tenant->id}", [], $this->superAdminHeaders())
            ->assertStatus(400);
    }

    public function test_crea_suscripcion_sin_autenticacion(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->postJson("/api/super-admin/subscription/{$tenant->id}", [])
            ->assertStatus(401);
    }

    // ── Subscription history ──────────────────────────────────

    public function test_historial_suscripciones_tenant(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->getJson("/api/super-admin/subscription/{$tenant->id}/history", $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['data']);
    }

    public function test_historial_suscripciones_incluye_monto_del_pago(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->postJson("/api/super-admin/subscription/{$tenant->id}", [
            'plan' => 'monthly',
            'starts_at' => now()->toDateString(),
            'amount' => 275.50,
        ], $this->superAdminHeaders());

        $this->getJson("/api/super-admin/subscription/{$tenant->id}/history", $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonFragment(['amount' => 275.5]);
    }

    public function test_registrar_pago_no_modifica_el_monto_configurado_del_tenant(): void
    {
        // El monto configurado (business_config.subscription_amount) es independiente
        // del monto histórico de cada pago registrado en subscriptions.
        $tenant = BusinessConfigModel::first();
        $tenant->update([BusinessConfigModel::SUBSCRIPTION_AMOUNT => 350.00]);

        $this->postJson("/api/super-admin/subscription/{$tenant->id}", [
            'plan' => 'monthly',
            'starts_at' => now()->toDateString(),
            'amount' => 999.99,
        ], $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertDatabaseHas('business_config', ['id' => $tenant->id, 'subscription_amount' => 350.00]);
    }

    public function test_historial_sin_autenticacion(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->getJson("/api/super-admin/subscription/{$tenant->id}/history")
            ->assertStatus(401);
    }

    public function test_historial_sin_rol_superadmin(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->getJson("/api/super-admin/subscription/{$tenant->id}/history", $this->authHeaders())
            ->assertStatus(403);
    }

    public function test_crea_suscripcion_con_plan_lifetime(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->postJson("/api/super-admin/subscription/{$tenant->id}", [
            'plan' => 'lifetime',
            'starts_at' => now()->toDateString(),
            'amount' => 0,
        ], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.subscription_plan', 'lifetime');

        $tenant->refresh();
        $this->assertEquals('lifetime', $tenant->subscription_plan);
        $this->assertEquals('active', $tenant->subscription_status);
    }

    public function test_crea_suscripcion_plan_invalido(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->postJson("/api/super-admin/subscription/{$tenant->id}", [
            'plan' => 'noexiste',
            'starts_at' => now()->toDateString(),
        ], $this->superAdminHeaders())
            ->assertStatus(400);
    }

    public function test_crea_suscripcion_fecha_invalida(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->postJson("/api/super-admin/subscription/{$tenant->id}", [
            'plan' => 'monthly',
            'starts_at' => 'no-es-fecha',
        ], $this->superAdminHeaders())
            ->assertStatus(400);
    }

    public function test_tenant_inexistente_retorna_404(): void
    {
        $this->getJson('/api/super-admin/subscription/99999/history', $this->superAdminHeaders())
            ->assertStatus(404);
    }

    public function test_lista_suscripciones_sin_rol_superadmin(): void
    {
        $this->getJson('/api/super-admin/subscription', $this->authHeaders())
            ->assertStatus(403);
    }

    public function test_lista_suscripciones_incluye_is_demo(): void
    {
        $this->getJson('/api/super-admin/subscription', $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'business_name', 'subscription_status', 'is_demo']]]);
    }

    public function test_lista_suscripciones_filtra_por_is_demo_true(): void
    {
        $demo = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'demo-sub-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Demo Suscripcion',
        ]);
        $noDemo = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'no-demo-sub-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::BUSINESS_NAME => 'Negocio No Demo Suscripcion',
        ]);

        $response = $this->getJson('/api/super-admin/subscription?is_demo=true', $this->superAdminHeaders())
            ->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');

        $this->assertTrue($ids->contains($demo->id));
        $this->assertFalse($ids->contains($noDemo->id));
    }

    public function test_lista_suscripciones_filtra_por_is_demo_false(): void
    {
        $demo = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'demo-sub2-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Demo Suscripcion 2',
        ]);
        $noDemo = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'no-demo-sub2-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::BUSINESS_NAME => 'Negocio No Demo Suscripcion 2',
        ]);

        $response = $this->getJson('/api/super-admin/subscription?is_demo=false', $this->superAdminHeaders())
            ->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');

        $this->assertTrue($ids->contains($noDemo->id));
        $this->assertFalse($ids->contains($demo->id));
    }

    public function test_lista_suscripciones_sin_filtro_excluye_demo_por_defecto(): void
    {
        $demo = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'demo-sub3-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Demo Suscripcion 3',
        ]);
        $noDemo = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'no-demo-sub3-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::BUSINESS_NAME => 'Negocio No Demo Suscripcion 3',
        ]);

        $response = $this->getJson('/api/super-admin/subscription', $this->superAdminHeaders())
            ->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id');

        $this->assertFalse($ids->contains($demo->id));
        $this->assertTrue($ids->contains($noDemo->id));
    }

    public function test_actualiza_payment_info(): void
    {
        $this->putJson('/api/super-admin/settings', [
            'payment_info' => [
                'bank' => 'Bancolombia',
                'account' => '1234567890',
                'holder' => 'Mi Empresa',
                'concept' => 'Pago mensual',
            ],
        ], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.payment_info.bank', 'Bancolombia');
    }

    public function test_payment_info_requiere_campos_obligatorios(): void
    {
        $this->putJson('/api/super-admin/settings', [
            'payment_info' => [
                'concept' => 'solo concept sin bank ni account ni holder',
            ],
        ], $this->superAdminHeaders())
            ->assertStatus(400);
    }

    // ── Subscription MRR ──────────────────────────────────────

    public function test_mrr_sin_autenticacion(): void
    {
        $this->getJson('/api/super-admin/subscription/mrr')
            ->assertStatus(401);
    }

    public function test_mrr_sin_rol_superadmin(): void
    {
        $this->getJson('/api/super-admin/subscription/mrr', $this->authHeaders())
            ->assertStatus(403);
    }

    public function test_mrr_retorna_cero_sin_tenants_pagantes(): void
    {
        // El tenant sembrado por defecto queda en plan lifetime (ver Tests\TestCase::setUp),
        // por lo que sin tenants adicionales el ingreso mensual debe ser 0.
        $this->getJson('/api/super-admin/subscription/mrr', $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.total_monthly_revenue', 0);
    }

    public function test_mrr_suma_tenants_activos_pagantes(): void
    {
        BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'mrr-tenant-1-'.uniqid(),
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Pagante 1',
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::SUBSCRIPTION_PLAN => 'monthly',
            BusinessConfigModel::SUBSCRIPTION_AMOUNT => 150.00,
        ]);
        BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'mrr-tenant-2-'.uniqid(),
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Pagante 2',
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::SUBSCRIPTION_PLAN => 'annual',
            BusinessConfigModel::SUBSCRIPTION_AMOUNT => 349.50,
        ]);

        $this->getJson('/api/super-admin/subscription/mrr', $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total_monthly_revenue', 499.5);
    }

    public function test_mrr_excluye_tenants_demo(): void
    {
        BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'mrr-demo-'.uniqid(),
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Demo',
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => true,
            BusinessConfigModel::SUBSCRIPTION_PLAN => 'monthly',
            BusinessConfigModel::SUBSCRIPTION_AMOUNT => 200.00,
        ]);

        $this->getJson('/api/super-admin/subscription/mrr', $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total_monthly_revenue', 0);
    }

    public function test_mrr_excluye_tenants_inactivos(): void
    {
        BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'mrr-inactivo-'.uniqid(),
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Inactivo',
            BusinessConfigModel::ACTIVO => false,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::SUBSCRIPTION_PLAN => 'monthly',
            BusinessConfigModel::SUBSCRIPTION_AMOUNT => 200.00,
        ]);

        $this->getJson('/api/super-admin/subscription/mrr', $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total_monthly_revenue', 0);
    }

    public function test_mrr_excluye_plan_lifetime(): void
    {
        BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'mrr-lifetime-'.uniqid(),
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Lifetime',
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::SUBSCRIPTION_PLAN => 'lifetime',
            BusinessConfigModel::SUBSCRIPTION_AMOUNT => 5000.00,
        ]);

        $this->getJson('/api/super-admin/subscription/mrr', $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total_monthly_revenue', 0);
    }

    public function test_mrr_excluye_tenants_sin_monto_de_suscripcion(): void
    {
        BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'mrr-sin-monto-'.uniqid(),
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Sin Monto',
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::SUBSCRIPTION_PLAN => 'monthly',
            BusinessConfigModel::SUBSCRIPTION_AMOUNT => 0,
        ]);

        $this->getJson('/api/super-admin/subscription/mrr', $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total_monthly_revenue', 0);
    }
}
