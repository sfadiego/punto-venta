<?php

namespace Tests\Admin;

use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\Permission;
use App\Models\RolePermission;
use Tests\TestCase;

class RolePermissionTest extends TestCase
{
    // ── Index ────────────────────────────────────────────────

    public function test_index_retorna_mapa_de_los_tres_roles_configurables(): void
    {
        $response = $this->getJson('/api/admin/role-permissions', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $data = $response->json('data');
        $this->assertArrayHasKey((string) RoleEnum::EMPLOYE->value, $data);
        $this->assertArrayHasKey((string) RoleEnum::COCINA->value, $data);
        $this->assertArrayHasKey((string) RoleEnum::CAJA->value, $data);
    }

    public function test_index_incluye_permisos_ya_otorgados(): void
    {
        $tenant = BusinessConfigModel::first();
        $permission = Permission::where(Permission::KEY, 'viewOrders')->first();

        RolePermission::where(RolePermission::ROLE_ID, RoleEnum::EMPLOYE->value)->delete();
        RolePermission::create([
            RolePermission::TENANT_ID => $tenant->id,
            RolePermission::ROLE_ID => RoleEnum::EMPLOYE->value,
            RolePermission::PERMISSION_ID => $permission->id,
        ]);

        $response = $this->getJson('/api/admin/role-permissions', $this->authHeaders())
            ->assertStatus(200);

        $this->assertContains('viewOrders', $response->json('data.'.RoleEnum::EMPLOYE->value));
    }

    public function test_index_sin_autenticacion(): void
    {
        $this->getJson('/api/admin/role-permissions')->assertStatus(401);
    }

    // ── Update ───────────────────────────────────────────────

    public function test_actualiza_permisos_de_empleado(): void
    {
        $response = $this->putJson('/api/admin/role-permissions/'.RoleEnum::EMPLOYE->value, [
            'permissions' => ['viewOrders', 'takeOrder'],
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertEqualsCanonicalizing(['viewOrders', 'takeOrder'], $response->json('data'));
    }

    public function test_actualiza_permisos_de_cocina(): void
    {
        $this->putJson('/api/admin/role-permissions/'.RoleEnum::COCINA->value, [
            'permissions' => ['kitchenView'],
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data', ['kitchenView']);
    }

    public function test_actualiza_permisos_de_caja(): void
    {
        $this->putJson('/api/admin/role-permissions/'.RoleEnum::CAJA->value, [
            'permissions' => ['payOrder', 'registerExpense'],
        ], $this->authHeaders())
            ->assertStatus(200);

        $this->assertEqualsCanonicalizing(
            ['payOrder', 'registerExpense'],
            $this->getJson('/api/admin/role-permissions', $this->authHeaders())
                ->json('data.'.RoleEnum::CAJA->value)
        );
    }

    public function test_actualiza_reemplaza_permisos_anteriores(): void
    {
        $this->putJson('/api/admin/role-permissions/'.RoleEnum::EMPLOYE->value, [
            'permissions' => ['viewOrders', 'takeOrder'],
        ], $this->authHeaders())->assertStatus(200);

        $response = $this->putJson('/api/admin/role-permissions/'.RoleEnum::EMPLOYE->value, [
            'permissions' => ['printTicket'],
        ], $this->authHeaders())->assertStatus(200);

        $this->assertEquals(['printTicket'], $response->json('data'));
    }

    public function test_actualiza_con_lista_vacia_elimina_todos_los_permisos(): void
    {
        $this->putJson('/api/admin/role-permissions/'.RoleEnum::EMPLOYE->value, [
            'permissions' => ['viewOrders'],
        ], $this->authHeaders())->assertStatus(200);

        $response = $this->putJson('/api/admin/role-permissions/'.RoleEnum::EMPLOYE->value, [
            'permissions' => [],
        ], $this->authHeaders())->assertStatus(200);

        $this->assertEquals([], $response->json('data'));
    }

    public function test_no_permite_configurar_rol_admin(): void
    {
        $this->putJson('/api/admin/role-permissions/'.RoleEnum::ADMIN->value, [
            'permissions' => ['viewOrders'],
        ], $this->authHeaders())
            ->assertStatus(422);
    }

    public function test_no_permite_configurar_rol_superadmin(): void
    {
        $this->putJson('/api/admin/role-permissions/'.RoleEnum::SUPERADMIN->value, [
            'permissions' => ['viewOrders'],
        ], $this->authHeaders())
            ->assertStatus(422);
    }

    public function test_no_permite_configurar_rol_inexistente(): void
    {
        $this->putJson('/api/admin/role-permissions/999', [
            'permissions' => ['viewOrders'],
        ], $this->authHeaders())
            ->assertStatus(422);
    }

    public function test_rechaza_permiso_inexistente(): void
    {
        $this->putJson('/api/admin/role-permissions/'.RoleEnum::EMPLOYE->value, [
            'permissions' => ['permisoQueNoExiste'],
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_requiere_campo_permissions(): void
    {
        $this->putJson('/api/admin/role-permissions/'.RoleEnum::EMPLOYE->value, [
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_update_sin_autenticacion(): void
    {
        $this->putJson('/api/admin/role-permissions/'.RoleEnum::EMPLOYE->value, [
            'permissions' => ['viewOrders'],
        ])->assertStatus(401);
    }

    public function test_aislamiento_multi_tenant(): void
    {
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

        $response = $this->getJson('/api/admin/role-permissions', $this->authHeaders())
            ->assertStatus(200);

        $this->assertEquals([], $response->json('data.'.RoleEnum::EMPLOYE->value));
    }
}
