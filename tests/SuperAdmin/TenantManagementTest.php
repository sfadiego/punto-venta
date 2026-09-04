<?php

namespace Tests\SuperAdmin;

use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\PersonalAccessToken;
use App\Models\TenantActivityLogModel;
use App\Models\User;
use Carbon\Carbon;
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

    public function test_lista_tenants_filtra_solo_activos(): void
    {
        $activo = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'activo-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Activo',
        ]);
        $inactivo = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'inactivo-'.uniqid(),
            BusinessConfigModel::ACTIVO => false,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Inactivo',
        ]);
        $demo = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'demo-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Demo',
        ]);

        $response = $this->getJson('/api/super-admin/tenant?status=active&limit=100', $this->superAdminHeaders())
            ->assertStatus(206);

        $ids = collect($response->json('data'))->pluck('id');

        $this->assertTrue($ids->contains($activo->id));
        $this->assertFalse($ids->contains($inactivo->id));
        $this->assertFalse($ids->contains($demo->id));
    }

    public function test_lista_tenants_activos_excluye_eliminados(): void
    {
        $eliminado = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'eliminado-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::IS_DEMO => false,
            BusinessConfigModel::BUSINESS_NAME => 'Negocio Eliminado',
        ]);
        $eliminado->delete();

        $response = $this->getJson('/api/super-admin/tenant?status=active&limit=100', $this->superAdminHeaders())
            ->assertStatus(206);

        $ids = collect($response->json('data'))->pluck('id');
        $this->assertFalse($ids->contains($eliminado->id));
    }

    // ── Monitoreo de actividad (last_activity_at) ───────────────

    public function test_lista_tenants_incluye_last_activity_at(): void
    {
        $tenant = BusinessConfigModel::first();
        $recent = now()->subHour();

        TenantActivityLogModel::factory()->create([
            TenantActivityLogModel::TENANT_ID => $tenant->id,
            TenantActivityLogModel::CREATED_AT => now()->subDays(3),
        ]);
        TenantActivityLogModel::factory()->create([
            TenantActivityLogModel::TENANT_ID => $tenant->id,
            TenantActivityLogModel::CREATED_AT => $recent,
        ]);

        $response = $this->getJson('/api/super-admin/tenant?limit=100', $this->superAdminHeaders())
            ->assertStatus(206);

        $row = collect($response->json('data'))->firstWhere('id', $tenant->id);

        $this->assertNotNull($row['last_activity_at']);
        $this->assertSame($recent->toDateTimeString(), Carbon::parse($row['last_activity_at'])->toDateTimeString());
    }

    public function test_lista_tenants_last_activity_at_null_sin_actividad(): void
    {
        $tenant = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'sin-actividad-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Sin Actividad',
        ]);

        $response = $this->getJson('/api/super-admin/tenant?limit=100', $this->superAdminHeaders())
            ->assertStatus(206);

        $row = collect($response->json('data'))->firstWhere('id', $tenant->id);
        $this->assertNull($row['last_activity_at']);
    }

    public function test_muestra_tenant_incluye_last_activity_at_mas_reciente(): void
    {
        $tenant = BusinessConfigModel::first();
        $recent = now()->subHour();

        TenantActivityLogModel::factory()->create([
            TenantActivityLogModel::TENANT_ID => $tenant->id,
            TenantActivityLogModel::CREATED_AT => now()->subDays(5),
        ]);
        TenantActivityLogModel::factory()->create([
            TenantActivityLogModel::TENANT_ID => $tenant->id,
            TenantActivityLogModel::CREATED_AT => $recent,
        ]);

        $response = $this->getJson("/api/super-admin/tenant/{$tenant->id}", $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertSame(
            $recent->toDateTimeString(),
            Carbon::parse($response->json('data.last_activity_at'))->toDateTimeString()
        );
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

    public function test_crea_tenant_asigna_max_users_del_plan_inicial(): void
    {
        $payload = $this->tenantPayload();

        $response = $this->postJson('/api/super-admin/tenant', $payload, $this->superAdminHeaders())
            ->assertStatus(200);

        // Plan inicial es monthly → max_users = 4
        $this->assertDatabaseHas('business_config', [
            'id' => $response->json('data.id'),
            'max_users' => 4,
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

    public function test_active_users_count_cuenta_sesiones_no_cuentas_unicas(): void
    {
        // Reproduce el bug reportado: la MISMA cuenta logueada desde 2 dispositivos
        // debe contar como 2 sesiones activas, no como 1 (antes se agrupaba por
        // fila de `users`, ahora se cuenta por token/sesión de Sanctum).
        $tenant = BusinessConfigModel::first();
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $tokenA = $admin->issueAccessToken();
        $tokenA->accessToken->forceFill([PersonalAccessToken::LAST_USED_AT => now()])->save();
        $tokenB = $admin->issueAccessToken();
        $tokenB->accessToken->forceFill([PersonalAccessToken::LAST_USED_AT => now()])->save();

        $this->getJson("/api/super-admin/tenant/{$tenant->id}", $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.active_users_count', 2);
    }

    public function test_last_activity_at_no_aparece_desactualizado_con_usuarios_activos(): void
    {
        // Reproduce el bug reportado: un tenant con usuarios navegando activamente ahora mismo
        // (sesión Sanctum viva) pero sin un login/venta cerrada reciente en tenant_activity_logs
        // no debe mostrarse como "días sin actividad" — last_activity_at debe reflejar la sesión
        // activa, no solo los eventos de ActivityTypeEnum (LOGIN/SALE_CLOSED).
        $tenant = BusinessConfigModel::first();
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        TenantActivityLogModel::factory()->create([
            TenantActivityLogModel::TENANT_ID => $tenant->id,
            TenantActivityLogModel::CREATED_AT => now()->subDays(10),
        ]);

        $activeSession = $admin->issueAccessToken();
        $activeSession->accessToken->forceFill([PersonalAccessToken::LAST_USED_AT => now()])->save();

        $show = $this->getJson("/api/super-admin/tenant/{$tenant->id}", $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.active_users_count', 1);

        $this->assertSame(
            now()->toDateTimeString(),
            Carbon::parse($show->json('data.last_activity_at'))->toDateTimeString()
        );

        $list = $this->getJson('/api/super-admin/tenant?limit=100', $this->superAdminHeaders())
            ->assertStatus(206);

        $row = collect($list->json('data'))->firstWhere('id', $tenant->id);
        $this->assertSame(
            now()->toDateTimeString(),
            Carbon::parse($row['last_activity_at'])->toDateTimeString()
        );
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

    public function test_activa_impresion_bluetooth_del_tenant(): void
    {
        $tenant = BusinessConfigModel::first();
        $tenant->update([BusinessConfigModel::BLUETOOTH_PRINTING_ENABLED => false]);

        $this->putJson("/api/super-admin/tenant/{$tenant->id}", [
            'slug' => $tenant->slug,
            'business_name' => $tenant->business_name,
            'primary_color' => '#FF5733',
            'sidebar_color' => '#1C1917',
            'font_color' => '#FFFFFF',
            'label_color' => '#000000',
            'bluetooth_printing_enabled' => true,
        ], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.bluetooth_printing_enabled', true);

        $this->assertDatabaseHas('business_config', [
            'id' => $tenant->id,
            'bluetooth_printing_enabled' => true,
        ]);
    }

    public function test_activa_proveedores_y_empleados_del_tenant(): void
    {
        $tenant = BusinessConfigModel::first();
        $tenant->update([
            BusinessConfigModel::PURCHASES_ENABLED => false,
            BusinessConfigModel::EMPLOYEES_ENABLED => false,
        ]);

        $this->putJson("/api/super-admin/tenant/{$tenant->id}", [
            'slug' => $tenant->slug,
            'business_name' => $tenant->business_name,
            'primary_color' => '#F59E0B',
            'sidebar_color' => '#1C1917',
            'font_color' => '#FFFFFF',
            'label_color' => '#1C1917',
            'purchases_enabled' => true,
            'employees_enabled' => true,
        ], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.purchases_enabled', true)
            ->assertJsonPath('data.employees_enabled', true);

        $this->assertDatabaseHas('business_config', [
            'id' => $tenant->id,
            'purchases_enabled' => true,
            'employees_enabled' => true,
        ]);
    }

    public function test_activa_control_de_stock_del_tenant(): void
    {
        $tenant = BusinessConfigModel::first();
        $tenant->update([BusinessConfigModel::STOCK_ENABLED => false]);

        $this->putJson("/api/super-admin/tenant/{$tenant->id}", [
            'slug' => $tenant->slug,
            'business_name' => $tenant->business_name,
            'primary_color' => '#F59E0B',
            'sidebar_color' => '#1C1917',
            'font_color' => '#FFFFFF',
            'label_color' => '#1C1917',
            'stock_enabled' => true,
        ], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.stock_enabled', true);

        $this->assertDatabaseHas('business_config', [
            'id' => $tenant->id,
            'stock_enabled' => true,
        ]);
    }

    public function test_activa_clientes_del_tenant(): void
    {
        $tenant = BusinessConfigModel::first();
        $tenant->update([BusinessConfigModel::CUSTOMERS_ENABLED => false]);

        $this->putJson("/api/super-admin/tenant/{$tenant->id}", [
            'slug' => $tenant->slug,
            'business_name' => $tenant->business_name,
            'primary_color' => '#F59E0B',
            'sidebar_color' => '#1C1917',
            'font_color' => '#FFFFFF',
            'label_color' => '#1C1917',
            'customers_enabled' => true,
        ], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.customers_enabled', true);

        $this->assertDatabaseHas('business_config', [
            'id' => $tenant->id,
            'customers_enabled' => true,
        ]);
    }

    public function test_desactiva_clientes_del_tenant(): void
    {
        $tenant = BusinessConfigModel::first();
        $tenant->update([BusinessConfigModel::CUSTOMERS_ENABLED => true]);

        $this->putJson("/api/super-admin/tenant/{$tenant->id}", [
            'slug' => $tenant->slug,
            'business_name' => $tenant->business_name,
            'primary_color' => '#F59E0B',
            'sidebar_color' => '#1C1917',
            'font_color' => '#FFFFFF',
            'label_color' => '#1C1917',
            'customers_enabled' => false,
        ], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.customers_enabled', false);

        $this->assertDatabaseHas('business_config', [
            'id' => $tenant->id,
            'customers_enabled' => false,
        ]);
    }

    public function test_customers_enabled_desactivado_por_default_al_crear_tenant(): void
    {
        $payload = $this->tenantPayload();

        $response = $this->postJson('/api/super-admin/tenant', $payload, $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertDatabaseHas('business_config', [
            'id' => $response->json('data.id'),
            'customers_enabled' => false,
        ]);
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

    public function test_actualiza_max_users_del_tenant(): void
    {
        $payload = $this->tenantPayload();
        $id = $this->postJson('/api/super-admin/tenant', $payload, $this->superAdminHeaders())->json('data.id');

        $this->putJson("/api/super-admin/tenant/{$id}", [
            'slug' => $payload['slug'],
            'business_name' => 'Test',
            'primary_color' => '#F59E0B',
            'sidebar_color' => '#1C1917',
            'font_color' => '#FFFFFF',
            'label_color' => '#1C1917',
            'max_users' => 5,
        ], $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertDatabaseHas('business_config', ['id' => $id, 'max_users' => 5]);
    }

    public function test_actualiza_max_users_a_cualquier_valor_incluso_menor_al_conteo(): void
    {
        // El límite controla sesiones concurrentes, no cuentas — puede ser menor al número de cuentas
        $payload = $this->tenantPayload();
        $id = $this->postJson('/api/super-admin/tenant', $payload, $this->superAdminHeaders())->json('data.id');

        $tenant = BusinessConfigModel::find($id);
        User::factory()->count(3)->create([
            'rol_id' => RoleEnum::EMPLOYE->value,
            'tenant_id' => $tenant->id,
        ]);

        // 4 cuentas en total, límite fijado en 1 → debe aceptarse (controla sesiones, no cuentas)
        $this->putJson("/api/super-admin/tenant/{$id}", [
            'slug' => $payload['slug'],
            'business_name' => 'Test',
            'primary_color' => '#F59E0B',
            'sidebar_color' => '#1C1917',
            'font_color' => '#FFFFFF',
            'label_color' => '#1C1917',
            'max_users' => 1,
        ], $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertDatabaseHas('business_config', ['id' => $id, 'max_users' => 1]);
    }

    public function test_actualiza_monto_de_suscripcion_del_tenant(): void
    {
        $payload = $this->tenantPayload();
        $id = $this->postJson('/api/super-admin/tenant', $payload, $this->superAdminHeaders())->json('data.id');

        $this->putJson("/api/super-admin/tenant/{$id}", [
            'slug' => $payload['slug'],
            'business_name' => 'Test',
            'primary_color' => '#F59E0B',
            'sidebar_color' => '#1C1917',
            'font_color' => '#FFFFFF',
            'label_color' => '#1C1917',
            'subscription_amount' => 450.00,
        ], $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertDatabaseHas('business_config', ['id' => $id, 'subscription_amount' => 450.00]);
    }

    public function test_actualiza_monto_de_suscripcion_a_null(): void
    {
        $payload = $this->tenantPayload();
        $id = $this->postJson('/api/super-admin/tenant', $payload, $this->superAdminHeaders())->json('data.id');

        $this->putJson("/api/super-admin/tenant/{$id}", [
            'slug' => $payload['slug'],
            'business_name' => 'Test',
            'primary_color' => '#F59E0B',
            'sidebar_color' => '#1C1917',
            'font_color' => '#FFFFFF',
            'label_color' => '#1C1917',
            'subscription_amount' => 450.00,
        ], $this->superAdminHeaders());

        $this->putJson("/api/super-admin/tenant/{$id}", [
            'slug' => $payload['slug'],
            'business_name' => 'Test',
            'primary_color' => '#F59E0B',
            'sidebar_color' => '#1C1917',
            'font_color' => '#FFFFFF',
            'label_color' => '#1C1917',
            'subscription_amount' => null,
        ], $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertDatabaseHas('business_config', ['id' => $id, 'subscription_amount' => null]);
    }

    public function test_actualiza_tenant_sin_enviar_monto_no_lo_borra(): void
    {
        $payload = $this->tenantPayload();
        $id = $this->postJson('/api/super-admin/tenant', $payload, $this->superAdminHeaders())->json('data.id');

        $this->putJson("/api/super-admin/tenant/{$id}", [
            'slug' => $payload['slug'],
            'business_name' => 'Test',
            'primary_color' => '#F59E0B',
            'sidebar_color' => '#1C1917',
            'font_color' => '#FFFFFF',
            'label_color' => '#1C1917',
            'subscription_amount' => 450.00,
        ], $this->superAdminHeaders());

        // Actualiza otro campo sin incluir subscription_amount en el body
        $this->putJson("/api/super-admin/tenant/{$id}", [
            'slug' => $payload['slug'],
            'business_name' => 'Otro nombre',
            'primary_color' => '#F59E0B',
            'sidebar_color' => '#1C1917',
            'font_color' => '#FFFFFF',
            'label_color' => '#1C1917',
        ], $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertDatabaseHas('business_config', ['id' => $id, 'subscription_amount' => 450.00]);
    }

    public function test_no_actualiza_monto_de_suscripcion_negativo(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->putJson("/api/super-admin/tenant/{$tenant->id}", [
            'slug' => $tenant->slug,
            'business_name' => 'Test',
            'primary_color' => '#F59E0B',
            'sidebar_color' => '#1C1917',
            'font_color' => '#FFFFFF',
            'label_color' => '#1C1917',
            'subscription_amount' => -10,
        ], $this->superAdminHeaders())
            ->assertStatus(400);
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

    // ── Activity ──────────────────────────────────────────────

    public function test_actividad_del_tenant_agrega_por_dia_y_hora(): void
    {
        $tenant = BusinessConfigModel::first();

        TenantActivityLogModel::factory()->create([
            TenantActivityLogModel::TENANT_ID => $tenant->id,
            TenantActivityLogModel::CREATED_AT => now(),
        ]);
        TenantActivityLogModel::factory()->create([
            TenantActivityLogModel::TENANT_ID => $tenant->id,
            TenantActivityLogModel::CREATED_AT => now(),
        ]);
        TenantActivityLogModel::factory()->create([
            TenantActivityLogModel::TENANT_ID => $tenant->id,
            TenantActivityLogModel::CREATED_AT => now()->subDays(2),
        ]);

        $response = $this->getJson("/api/super-admin/tenant/{$tenant->id}/activity?days=7", $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['data' => ['daily' => [['date', 'count']], 'hourly' => [['hour', 'count']]]]);

        $daily = collect($response->json('data.daily'));
        $hourly = collect($response->json('data.hourly'));

        $this->assertCount(7, $daily);
        $this->assertCount(24, $hourly);
        $this->assertSame(2, $daily->firstWhere('date', now()->toDateString())['count']);
        $this->assertSame(1, $daily->firstWhere('date', now()->subDays(2)->toDateString())['count']);
        $this->assertSame(3, $hourly->sum('count'));
    }

    public function test_actividad_del_tenant_no_incluye_otro_tenant(): void
    {
        $tenant = BusinessConfigModel::first();
        $otherTenant = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'otro-tenant-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Otro negocio',
        ]);

        TenantActivityLogModel::factory()->create([TenantActivityLogModel::TENANT_ID => $otherTenant->id]);

        $response = $this->getJson("/api/super-admin/tenant/{$tenant->id}/activity", $this->superAdminHeaders())
            ->assertStatus(200);

        $total = collect($response->json('data.daily'))->sum('count');
        $this->assertSame(0, $total);
    }

    public function test_actividad_del_tenant_sin_autenticacion(): void
    {
        $tenant = BusinessConfigModel::first();
        $this->getJson("/api/super-admin/tenant/{$tenant->id}/activity")->assertStatus(401);
    }
}
