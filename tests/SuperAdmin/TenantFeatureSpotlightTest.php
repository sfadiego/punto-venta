<?php

namespace Tests\SuperAdmin;

use App\Enums\FeatureSpotlightEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\User;
use Tests\TestCase;

class TenantFeatureSpotlightTest extends TestCase
{
    private function superAdminHeaders(): array
    {
        $user = User::where('rol_id', RoleEnum::SUPERADMIN->value)->first();

        return $this->authHeaders($user);
    }

    // ── index ──────────────────────────────────────────────────

    public function test_index_requiere_autenticacion(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->getJson("/api/super-admin/tenant/{$tenant->id}/feature-spotlights")
            ->assertStatus(401);
    }

    public function test_index_requiere_rol_superadmin(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->getJson("/api/super-admin/tenant/{$tenant->id}/feature-spotlights", $this->authHeaders())
            ->assertStatus(403);
    }

    public function test_index_devuelve_todos_los_features_habilitados_por_defecto(): void
    {
        $tenant = BusinessConfigModel::first();

        $response = $this->getJson("/api/super-admin/tenant/{$tenant->id}/feature-spotlights", $this->superAdminHeaders());

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(count(FeatureSpotlightEnum::cases()), $data);
        $this->assertTrue(collect($data)->every(fn ($item) => $item['enabled'] === true));
    }

    // ── update ─────────────────────────────────────────────────

    public function test_update_deshabilita_los_features_no_incluidos(): void
    {
        $tenant = BusinessConfigModel::first();
        $headers = $this->superAdminHeaders();

        $allKeys = collect(FeatureSpotlightEnum::cases())->pluck('value');
        $enabledKeys = $allKeys->reject(fn ($key) => $key === FeatureSpotlightEnum::ROLE_PERMISSIONS->value)->values();

        $this->putJson("/api/super-admin/tenant/{$tenant->id}/feature-spotlights", [
            'enabled_keys' => $enabledKeys->all(),
        ], $headers)->assertStatus(200);

        $response = $this->getJson("/api/super-admin/tenant/{$tenant->id}/feature-spotlights", $headers);

        $data = collect($response->json('data'))->keyBy('key');
        $this->assertFalse($data[FeatureSpotlightEnum::ROLE_PERMISSIONS->value]['enabled']);
        $this->assertTrue($data[FeatureSpotlightEnum::EXPENSES_BUTTON->value]['enabled']);

        $this->assertDatabaseHas('feature_spotlights_seen', [
            'tenant_id' => $tenant->id,
            'user_id' => null,
            'feature_key' => FeatureSpotlightEnum::ROLE_PERMISSIONS->value,
        ]);
    }

    public function test_update_puede_rehabilitar_un_feature_deshabilitado(): void
    {
        $tenant = BusinessConfigModel::first();
        $headers = $this->superAdminHeaders();

        $allKeys = collect(FeatureSpotlightEnum::cases())->pluck('value')->all();

        // Primero se deshabilita todo, luego se vuelve a habilitar por completo.
        $this->putJson("/api/super-admin/tenant/{$tenant->id}/feature-spotlights", [
            'enabled_keys' => [],
        ], $headers)->assertStatus(200);

        $this->putJson("/api/super-admin/tenant/{$tenant->id}/feature-spotlights", [
            'enabled_keys' => $allKeys,
        ], $headers)->assertStatus(200);

        $this->assertDatabaseCount('feature_spotlights_seen', 0);
    }

    public function test_update_rechaza_un_key_no_reconocido(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->putJson("/api/super-admin/tenant/{$tenant->id}/feature-spotlights", [
            'enabled_keys' => ['key_inexistente'],
        ], $this->superAdminHeaders())->assertStatus(400);
    }

    // ── Efecto en el endpoint de la app (no-superadmin) ───────────

    public function test_feature_deshabilitado_para_el_tenant_aparece_como_visto_en_la_app(): void
    {
        $tenant = BusinessConfigModel::first();
        $superAdminHeaders = $this->superAdminHeaders();

        $allKeys = collect(FeatureSpotlightEnum::cases())->pluck('value');
        $enabledKeys = $allKeys->reject(fn ($key) => $key === FeatureSpotlightEnum::ROLE_PERMISSIONS->value)->values();

        $this->putJson("/api/super-admin/tenant/{$tenant->id}/feature-spotlights", [
            'enabled_keys' => $enabledKeys->all(),
        ], $superAdminHeaders)->assertStatus(200);

        // RequestGuard memoiza el usuario resuelto en la primera llamada dentro del
        // mismo test (mismo AuthManager) — sin esto, esta request seguiría
        // autenticada como el SuperAdmin de la llamada anterior en vez del admin.
        $this->app['auth']->forgetGuards();

        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();
        $response = $this->getJson('/api/feature-spotlights/seen', $this->authHeaders($admin));

        $response->assertStatus(200)
            ->assertJsonFragment(['role_permissions']);
    }
}
