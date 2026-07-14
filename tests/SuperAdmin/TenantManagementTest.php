<?php

namespace Tests\SuperAdmin;

use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\User;
use Tests\TestCase;

class TenantManagementTest extends TestCase
{
    private function superAdminHeaders(): array
    {
        $user = User::where('rol_id', RoleEnum::SUPERADMIN->value)->first();

        return $this->authHeaders($user);
    }

    private function tenantPayload(array $overrides = []): array
    {
        return array_merge([
            'slug' => 'nuevo-negocio-'.uniqid(),
            'business_name' => 'Negocio Test',
            'primary_color' => '#F59E0B',
            'sidebar_color' => '#1C1917',
            'font_color' => '#FFFFFF',
            'label_color' => '#1C1917',
            'admin_nombre' => 'Admin',
            'admin_apellido' => 'Test',
            'admin_email' => 'admin'.uniqid().'@test.com',
            'admin_usuario' => 'admin-'.uniqid(),
            'admin_password' => 'password123',
        ], $overrides);
    }

    // ── Index ─────────────────────────────────────────────────

    public function test_lista_tenants(): void
    {
        $this->getJson('/api/super-admin/tenant', $this->superAdminHeaders())
            ->assertStatus(206)
            ->assertJsonStructure(['current_page', 'data', 'total', 'per_page']);
    }

    public function test_lista_tenants_sin_autenticacion(): void
    {
        $this->getJson('/api/super-admin/tenant')->assertStatus(401);
    }

    public function test_lista_tenants_sin_rol_superadmin(): void
    {
        $this->getJson('/api/super-admin/tenant', $this->authHeaders())->assertStatus(403);
    }

    // ── Store ─────────────────────────────────────────────────

    public function test_crea_tenant(): void
    {
        $payload = $this->tenantPayload();

        $this->postJson('/api/super-admin/tenant', $payload, $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.business_name', 'Negocio Test')
            ->assertJsonPath('data.slug', $payload['slug']);

        $this->assertDatabaseHas('business_config', ['slug' => $payload['slug']]);
        $this->assertDatabaseHas('users', ['email' => $payload['admin_email']]);
    }

    public function test_crea_tenant_crea_suscripcion_mensual_inicial(): void
    {
        $payload = $this->tenantPayload();

        $response = $this->postJson('/api/super-admin/tenant', $payload, $this->superAdminHeaders())
            ->assertStatus(200);

        $tenantId = $response->json('data.id');
        $this->assertDatabaseHas('subscriptions', [
            'tenant_id' => $tenantId,
            'plan' => 'monthly',
        ]);
    }

    public function test_no_crea_tenant_sin_slug(): void
    {
        $this->postJson('/api/super-admin/tenant', $this->tenantPayload(['slug' => '']), $this->superAdminHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_tenant_con_slug_duplicado(): void
    {
        $existing = BusinessConfigModel::first();

        $this->postJson('/api/super-admin/tenant', $this->tenantPayload(['slug' => $existing->slug]), $this->superAdminHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_tenant_sin_business_name(): void
    {
        $this->postJson('/api/super-admin/tenant', $this->tenantPayload(['business_name' => '']), $this->superAdminHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_tenant_sin_datos_admin(): void
    {
        $payload = $this->tenantPayload();
        unset($payload['admin_nombre'], $payload['admin_email'], $payload['admin_password']);

        $this->postJson('/api/super-admin/tenant', $payload, $this->superAdminHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_tenant_con_email_admin_duplicado(): void
    {
        $existing = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->postJson('/api/super-admin/tenant', $this->tenantPayload([
            'admin_email' => $existing->email,
        ]), $this->superAdminHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_tenant_sin_autenticacion(): void
    {
        $this->postJson('/api/super-admin/tenant', $this->tenantPayload())->assertStatus(401);
    }

    public function test_no_crea_tenant_sin_rol_superadmin(): void
    {
        $this->postJson('/api/super-admin/tenant', $this->tenantPayload(), $this->authHeaders())->assertStatus(403);
    }

    // ── Show ──────────────────────────────────────────────────

    public function test_muestra_tenant(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->getJson("/api/super-admin/tenant/{$tenant->id}", $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.id', $tenant->id)
            ->assertJsonStructure(['data' => ['id', 'business_name', 'slug', 'activo', 'features']]);
    }

    public function test_muestra_tenant_inexistente(): void
    {
        $this->getJson('/api/super-admin/tenant/99999', $this->superAdminHeaders())
            ->assertStatus(404);
    }

    public function test_muestra_tenant_sin_autenticacion(): void
    {
        $tenant = BusinessConfigModel::first();
        $this->getJson("/api/super-admin/tenant/{$tenant->id}")->assertStatus(401);
    }

    // ── Update ────────────────────────────────────────────────

    public function test_actualiza_tenant(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->putJson("/api/super-admin/tenant/{$tenant->id}", [
            'slug' => $tenant->slug,
            'business_name' => 'Nombre Actualizado',
            'primary_color' => '#FF5733',
            'sidebar_color' => '#1C1917',
            'font_color' => '#FFFFFF',
            'label_color' => '#000000',
        ], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.business_name', 'Nombre Actualizado');

        $this->assertDatabaseHas('business_config', ['id' => $tenant->id, 'business_name' => 'Nombre Actualizado']);
    }

    public function test_no_actualiza_tenant_con_slug_duplicado(): void
    {
        // Crear un segundo tenant para poder duplicar slug
        $payload = $this->tenantPayload(['slug' => 'slug-unico-'.uniqid()]);
        $response = $this->postJson('/api/super-admin/tenant', $payload, $this->superAdminHeaders());
        $newId = $response->json('data.id');

        $original = BusinessConfigModel::first();

        $this->putJson("/api/super-admin/tenant/{$newId}", [
            'slug' => $original->slug, // slug del primer tenant → duplicado
            'business_name' => 'Test',
            'primary_color' => '#FF5733',
            'sidebar_color' => '#1C1917',
            'font_color' => '#FFFFFF',
            'label_color' => '#000000',
        ], $this->superAdminHeaders())
            ->assertStatus(400);
    }

    public function test_actualiza_mismo_slug_no_falla_unique(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->putJson("/api/super-admin/tenant/{$tenant->id}", [
            'slug' => $tenant->slug,
            'business_name' => $tenant->business_name,
            'primary_color' => '#F59E0B',
            'sidebar_color' => '#1C1917',
            'font_color' => '#FFFFFF',
            'label_color' => '#1C1917',
        ], $this->superAdminHeaders())
            ->assertStatus(200);
    }

    public function test_no_actualiza_sin_autenticacion(): void
    {
        $tenant = BusinessConfigModel::first();
        $this->putJson("/api/super-admin/tenant/{$tenant->id}", [])->assertStatus(401);
    }

    // ── Toggle ────────────────────────────────────────────────

    public function test_toggle_activo_del_tenant(): void
    {
        $tenant = BusinessConfigModel::first();
        $estadoOriginal = $tenant->activo;

        $this->patchJson("/api/super-admin/tenant/{$tenant->id}/toggle", [], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.activo', ! $estadoOriginal);

        $this->assertDatabaseHas('business_config', ['id' => $tenant->id, 'activo' => ! $estadoOriginal]);
    }

    public function test_toggle_doble_regresa_al_estado_original(): void
    {
        $tenant = BusinessConfigModel::first();
        $estadoOriginal = $tenant->activo;

        $this->patchJson("/api/super-admin/tenant/{$tenant->id}/toggle", [], $this->superAdminHeaders());
        $this->patchJson("/api/super-admin/tenant/{$tenant->id}/toggle", [], $this->superAdminHeaders());

        $this->assertDatabaseHas('business_config', ['id' => $tenant->id, 'activo' => $estadoOriginal]);
    }

    public function test_toggle_sin_autenticacion(): void
    {
        $tenant = BusinessConfigModel::first();
        $this->patchJson("/api/super-admin/tenant/{$tenant->id}/toggle")->assertStatus(401);
    }

    // ── Delete ────────────────────────────────────────────────

    public function test_elimina_tenant_soft_delete(): void
    {
        $payload = $this->tenantPayload();
        $response = $this->postJson('/api/super-admin/tenant', $payload, $this->superAdminHeaders());
        $id = $response->json('data.id');

        $this->deleteJson("/api/super-admin/tenant/{$id}", [], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertSoftDeleted('business_config', ['id' => $id]);
    }

    public function test_elimina_sin_autenticacion(): void
    {
        $tenant = BusinessConfigModel::first();
        $this->deleteJson("/api/super-admin/tenant/{$tenant->id}")->assertStatus(401);
    }

    // ── Restore ───────────────────────────────────────────────

    public function test_restaura_tenant_eliminado(): void
    {
        $payload = $this->tenantPayload();
        $response = $this->postJson('/api/super-admin/tenant', $payload, $this->superAdminHeaders());
        $id = $response->json('data.id');

        $this->deleteJson("/api/super-admin/tenant/{$id}", [], $this->superAdminHeaders());

        $this->patchJson("/api/super-admin/tenant/{$id}/restore", [], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertDatabaseHas('business_config', ['id' => $id, 'deleted_at' => null]);
    }

    public function test_restaura_tenant_no_eliminado_falla(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->patchJson("/api/super-admin/tenant/{$tenant->id}/restore", [], $this->superAdminHeaders())
            ->assertStatus(404);
    }

    // ── Clear demo data ───────────────────────────────────────

    public function test_limpia_datos_demo_de_tenant(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->deleteJson("/api/super-admin/tenant/{$tenant->id}/demo-data", [], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_limpia_datos_demo_sin_autenticacion(): void
    {
        $tenant = BusinessConfigModel::first();
        $this->deleteJson("/api/super-admin/tenant/{$tenant->id}/demo-data")->assertStatus(401);
    }
}
