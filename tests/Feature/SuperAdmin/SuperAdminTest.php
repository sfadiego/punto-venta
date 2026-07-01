<?php

namespace Tests\Feature\SuperAdmin;

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

    public function test_login_sin_rol_superadmin(): void
    {
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->postJson('/api/super-admin/auth/login', [
            'email' => $admin->email,
            'password' => env('APP_ADMIN_PASSWORD'),
        ])->assertStatus(403);
    }

    public function test_login_sin_campos_requeridos(): void
    {
        $this->postJson('/api/super-admin/auth/login', [])
            ->assertStatus(400);
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
        $this->putJson('/api/super-admin/settings', [], $this->superAdminHeaders())
            ->assertStatus(400);
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

    public function test_historial_sin_autenticacion(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->getJson("/api/super-admin/subscription/{$tenant->id}/history")
            ->assertStatus(401);
    }
}
