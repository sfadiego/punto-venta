<?php

namespace Tests\SuperAdmin;

use App\Enums\BusinessTypeEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\Permission;
use App\Models\RolePermission;
use App\Models\User;
use Tests\TestCase;

class TenantRolePermissionTest extends TestCase
{
    private function superAdminHeaders(): array
    {
        $user = User::where('rol_id', RoleEnum::SUPERADMIN->value)->first();

        return $this->authHeaders($user);
    }

    private function crearTenantVentaPorPeso(): BusinessConfigModel
    {
        return BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'tenant-peso-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Carnicería Test',
            BusinessConfigModel::PRIMARY_COLOR => '#F59E0B',
            BusinessConfigModel::SIDEBAR_COLOR => '#1C1917',
            BusinessConfigModel::FONT_COLOR => '#FFFFFF',
            BusinessConfigModel::LABEL_COLOR => '#1C1917',
            BusinessConfigModel::SUBSCRIPTION_PLAN => 'lifetime',
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::VentaPorPeso,
        ]);
    }

    // ── Index ────────────────────────────────────────────────

    public function test_index_requiere_autenticacion(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->getJson("/api/super-admin/tenant/{$tenant->id}/role-permissions")
            ->assertStatus(401);
    }

    public function test_index_requiere_rol_superadmin(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->getJson("/api/super-admin/tenant/{$tenant->id}/role-permissions", $this->authHeaders())
            ->assertStatus(403);
    }

    public function test_index_retorna_mapa_de_los_tres_roles_configurables(): void
    {
        $tenant = BusinessConfigModel::first();

        $response = $this->getJson("/api/super-admin/tenant/{$tenant->id}/role-permissions", $this->superAdminHeaders())
            ->assertStatus(200);

        $data = $response->json('data');
        $this->assertArrayHasKey((string) RoleEnum::EMPLOYE->value, $data);
        $this->assertArrayHasKey((string) RoleEnum::COCINA->value, $data);
        $this->assertArrayHasKey((string) RoleEnum::CAJA->value, $data);
    }

    // ── Update ───────────────────────────────────────────────

    public function test_update_requiere_autenticacion(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->putJson("/api/super-admin/tenant/{$tenant->id}/role-permissions/".RoleEnum::EMPLOYE->value, [
            'permissions' => ['viewProducts'],
        ])->assertStatus(401);
    }

    public function test_update_requiere_rol_superadmin(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->putJson("/api/super-admin/tenant/{$tenant->id}/role-permissions/".RoleEnum::EMPLOYE->value, [
            'permissions' => ['viewProducts'],
        ], $this->authHeaders())->assertStatus(403);
    }

    public function test_update_otorga_permiso_al_rol_del_tenant_correcto_sin_credenciales_del_admin(): void
    {
        $tenant = BusinessConfigModel::first();

        $response = $this->putJson("/api/super-admin/tenant/{$tenant->id}/role-permissions/".RoleEnum::EMPLOYE->value, [
            'permissions' => ['viewProducts', 'viewOrders'],
        ], $this->superAdminHeaders())->assertStatus(200);

        $this->assertEqualsCanonicalizing(
            ['viewProducts', 'viewOrders'],
            $response->json('data.'.RoleEnum::EMPLOYE->value)
        );
    }

    public function test_update_no_permite_configurar_rol_admin(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->putJson("/api/super-admin/tenant/{$tenant->id}/role-permissions/".RoleEnum::ADMIN->value, [
            'permissions' => ['viewOrders'],
        ], $this->superAdminHeaders())->assertStatus(422);
    }

    public function test_update_venta_por_peso_no_permite_configurar_rol_cocina(): void
    {
        $tenant = $this->crearTenantVentaPorPeso();

        $this->putJson("/api/super-admin/tenant/{$tenant->id}/role-permissions/".RoleEnum::COCINA->value, [
            'permissions' => ['kitchenView'],
        ], $this->superAdminHeaders())->assertStatus(422);
    }

    public function test_update_rechaza_permiso_inexistente(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->putJson("/api/super-admin/tenant/{$tenant->id}/role-permissions/".RoleEnum::EMPLOYE->value, [
            'permissions' => ['permisoQueNoExiste'],
        ], $this->superAdminHeaders())->assertStatus(400);
    }

    public function test_update_no_afecta_permisos_de_otro_tenant(): void
    {
        $tenantA = BusinessConfigModel::first();
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
        $permission = Permission::where(Permission::KEY, 'viewOrders')->first();

        RolePermission::create([
            RolePermission::TENANT_ID => $tenantB->id,
            RolePermission::ROLE_ID => RoleEnum::EMPLOYE->value,
            RolePermission::PERMISSION_ID => $permission->id,
        ]);

        $headers = $this->superAdminHeaders();

        $this->putJson("/api/super-admin/tenant/{$tenantA->id}/role-permissions/".RoleEnum::EMPLOYE->value, [
            'permissions' => ['viewProducts'],
        ], $headers)->assertStatus(200);

        $responseB = $this->getJson("/api/super-admin/tenant/{$tenantB->id}/role-permissions", $headers)
            ->assertStatus(200);

        $this->assertEquals(['viewOrders'], $responseB->json('data.'.RoleEnum::EMPLOYE->value));
    }

    public function test_permiso_otorgado_desde_superadmin_habilita_el_endpoint_real_para_el_empleado(): void
    {
        $tenant = BusinessConfigModel::first();
        $superAdminHeaders = $this->superAdminHeaders();

        // Sin el permiso, un Employe recién configurado con otro permiso cualquiera
        // (para no caer en el fallback a DEFAULTS) no puede ver productos.
        $this->putJson("/api/super-admin/tenant/{$tenant->id}/role-permissions/".RoleEnum::EMPLOYE->value, [
            'permissions' => ['viewOrders'],
        ], $superAdminHeaders)->assertStatus(200);

        $employe = User::create([
            User::NOMBRE => 'Empleado',
            User::APELLIDO_PATERNO => 'Test',
            User::APELLIDO_MATERNO => '',
            User::EMAIL => 'empleado-'.uniqid().'@test.com',
            User::USUARIO => 'empleado-'.uniqid(),
            User::PASSWORD => bcrypt('password123'),
            User::ROL_ID => RoleEnum::EMPLOYE->value,
            User::ACTIVO => true,
            User::TENANT_ID => $tenant->id,
        ]);

        $this->app['auth']->forgetGuards();
        $this->getJson('/api/product', $this->authHeaders($employe))->assertStatus(403);

        // El SuperAdmin otorga viewProducts sin loguearse como el Admin del tenant.
        // ResolveTenant deja `tenant_id` bindeado como singleton en el contenedor tras la request
        // anterior (del Employe) — en producción cada request HTTP arranca un contenedor nuevo así
        // que esto nunca se filtra entre requests reales, pero en un test que reutiliza el mismo
        // contenedor para varias llamadas sí persiste, y como User::class también usa HasTenant,
        // el guard de Sanctum no podría resolver al SuperAdmin (tenant_id null) bajo ese scope
        // heredado. Hay que limpiarlo explícitamente al cambiar de "contexto de tenant" en el test.
        $this->app['auth']->forgetGuards();
        $this->app->forgetInstance('tenant_id');
        $this->putJson("/api/super-admin/tenant/{$tenant->id}/role-permissions/".RoleEnum::EMPLOYE->value, [
            'permissions' => ['viewOrders', 'viewProducts'],
        ], $superAdminHeaders)->assertStatus(200);

        // 206: convención del proyecto para listados paginados vía DataTable (Http::PartialContent
        // en Response::successDataTable), no un error — aquí confirma que ya no es el 403 de antes.
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/product', $this->authHeaders($employe))->assertStatus(206);
    }
}
