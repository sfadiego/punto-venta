<?php

namespace Tests\Security;

use App\Enums\MainOrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BranchModel;
use App\Models\BusinessConfigModel;
use App\Models\MainOrderReportModel;
use App\Models\Permission;
use App\Models\RolePermission;
use App\Models\User;
use Tests\TestCase;

/**
 * GET /admin/users/{user}/branches — cierra el hueco identificado en la Fase 1: consultar
 * qué sucursales tiene asignadas un usuario específico (antes solo se podía ver "qué
 * usuarios tiene una sucursal" vía branch/{branch}/users).
 */
class UserBranchesTest extends TestCase
{
    private function tenantId(): int
    {
        return BusinessConfigModel::first()->id;
    }

    private function crearUsuario(RoleEnum $rol): User
    {
        return User::factory()->create([
            User::ROL_ID => $rol->value,
            User::TENANT_ID => $this->tenantId(),
        ]);
    }

    private function crearSucursal(string $name): BranchModel
    {
        return BranchModel::create([
            BranchModel::NAME => $name,
            BranchModel::TENANT_ID => $this->tenantId(),
            BranchModel::ACTIVE => true,
        ]);
    }

    private function otorgarPermiso(int $roleId, string $key): void
    {
        $permission = Permission::where(Permission::KEY, $key)->firstOrFail();

        RolePermission::create([
            RolePermission::TENANT_ID => $this->tenantId(),
            RolePermission::ROLE_ID => $roleId,
            RolePermission::PERMISSION_ID => $permission->id,
        ]);
    }

    private function abrirCaja(User $user, int $branchId): MainOrderReportModel
    {
        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN->value,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => $user->id,
            MainOrderReportModel::TENANT_ID => $this->tenantId(),
            MainOrderReportModel::BRANCH_ID => $branchId,
        ]);
    }

    public function test_admin_consulta_sucursales_de_un_empleado(): void
    {
        $sucursalA = $this->crearSucursal('A');
        $sucursalB = $this->crearSucursal('B');
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $sucursalA->users()->attach($empleado->id, [BranchModel::TENANT_ID => $this->tenantId()]);

        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $data = $this->getJson("/api/admin/users/{$empleado->id}/branches", $this->authHeaders($admin))
            ->assertStatus(200)
            ->json('data');

        $this->assertFalse($data['is_admin']);
        $this->assertEquals([$sucursalA->id], $data['branch_ids']);
        $this->assertNotContains($sucursalB->id, $data['branch_ids']);
    }

    public function test_admin_consultado_marca_is_admin_sin_necesidad_de_asignacion(): void
    {
        $otroAdmin = $this->crearUsuario(RoleEnum::ADMIN);
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $data = $this->getJson("/api/admin/users/{$otroAdmin->id}/branches", $this->authHeaders($admin))
            ->assertStatus(200)
            ->json('data');

        $this->assertTrue($data['is_admin']);
        $this->assertEquals([], $data['branch_ids']);
    }

    public function test_empleado_sin_permiso_viewusers_no_consulta_sucursales_de_otro(): void
    {
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $otro = $this->crearUsuario(RoleEnum::EMPLOYE);

        $this->getJson("/api/admin/users/{$otro->id}/branches", $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    public function test_empleado_con_permiso_viewusers_si_consulta_sucursales(): void
    {
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewUsers');
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $otro = $this->crearUsuario(RoleEnum::EMPLOYE);

        $this->getJson("/api/admin/users/{$otro->id}/branches", $this->authHeaders($empleado))
            ->assertStatus(200);
    }

    // ── PUT /admin/users/{user}/branches ─────────────────────────

    public function test_admin_actualiza_sucursales_de_un_empleado(): void
    {
        $sucursalA = $this->crearSucursal('A');
        $sucursalB = $this->crearSucursal('B');
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $sucursalA->users()->attach($empleado->id, [BranchModel::TENANT_ID => $this->tenantId()]);
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->putJson(
            "/api/admin/users/{$empleado->id}/branches",
            ['branch_ids' => [$sucursalB->id]],
            $this->authHeaders($admin)
        )->assertStatus(200)->assertJsonPath('data.branch_ids', [$sucursalB->id]);

        $this->assertDatabaseMissing('user_branch', ['user_id' => $empleado->id, 'branch_id' => $sucursalA->id]);
        $this->assertDatabaseHas('user_branch', ['user_id' => $empleado->id, 'branch_id' => $sucursalB->id]);
    }

    public function test_no_permite_asignar_sucursales_a_un_admin(): void
    {
        $sucursal = $this->crearSucursal('A');
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();
        $otroAdmin = $this->crearUsuario(RoleEnum::ADMIN);

        $this->putJson(
            "/api/admin/users/{$otroAdmin->id}/branches",
            ['branch_ids' => [$sucursal->id]],
            $this->authHeaders($admin)
        )->assertJsonPath('status', 'error');

        $this->assertDatabaseMissing('user_branch', ['user_id' => $otroAdmin->id]);
    }

    public function test_empleado_no_puede_actualizar_sucursales_de_otro(): void
    {
        $sucursal = $this->crearSucursal('A');
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $otro = $this->crearUsuario(RoleEnum::EMPLOYE);

        $this->putJson(
            "/api/admin/users/{$otro->id}/branches",
            ['branch_ids' => [$sucursal->id]],
            $this->authHeaders($empleado)
        )->assertStatus(403);
    }

    public function test_no_permite_sucursal_de_otro_tenant(): void
    {
        $otroTenant = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'otro-tenant-userbranches-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Otro Tenant',
            BusinessConfigModel::PRIMARY_COLOR => '#F59E0B',
            BusinessConfigModel::SIDEBAR_COLOR => '#1C1917',
            BusinessConfigModel::FONT_COLOR => '#FFFFFF',
            BusinessConfigModel::LABEL_COLOR => '#1C1917',
        ]);
        $sucursalOtroTenant = BranchModel::create([
            BranchModel::NAME => 'Ajena', BranchModel::TENANT_ID => $otroTenant->id, BranchModel::ACTIVE => true,
        ]);
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->putJson(
            "/api/admin/users/{$empleado->id}/branches",
            ['branch_ids' => [$sucursalOtroTenant->id]],
            $this->authHeaders($admin)
        )->assertStatus(400);
    }

    // ── No se puede quitar una sucursal donde el usuario tiene caja abierta ──

    public function test_no_permite_quitar_sucursal_con_caja_abierta_del_usuario(): void
    {
        $sucursalA = $this->crearSucursal('A');
        $sucursalB = $this->crearSucursal('B');
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $sucursalA->users()->attach($empleado->id, [BranchModel::TENANT_ID => $this->tenantId()]);
        $sucursalB->users()->attach($empleado->id, [BranchModel::TENANT_ID => $this->tenantId()]);
        $this->abrirCaja($empleado, $sucursalA->id);
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        // Intenta reasignar solo a B, quitándole A (donde tiene la caja abierta).
        $this->putJson(
            "/api/admin/users/{$empleado->id}/branches",
            ['branch_ids' => [$sucursalB->id]],
            $this->authHeaders($admin)
        )->assertJsonPath('status', 'error');

        $this->assertDatabaseHas('user_branch', ['user_id' => $empleado->id, 'branch_id' => $sucursalA->id]);
    }

    public function test_permite_reasignar_sucursal_sin_caja_abierta(): void
    {
        $sucursalA = $this->crearSucursal('A');
        $sucursalB = $this->crearSucursal('B');
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $sucursalA->users()->attach($empleado->id, [BranchModel::TENANT_ID => $this->tenantId()]);
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->putJson(
            "/api/admin/users/{$empleado->id}/branches",
            ['branch_ids' => [$sucursalB->id]],
            $this->authHeaders($admin)
        )->assertStatus(200);

        $this->assertDatabaseMissing('user_branch', ['user_id' => $empleado->id, 'branch_id' => $sucursalA->id]);
    }

    public function test_no_permite_quitar_usuario_de_sucursal_con_caja_abierta_desde_branch_sync_users(): void
    {
        $sucursal = $this->crearSucursal('A');
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $sucursal->users()->attach($empleado->id, [BranchModel::TENANT_ID => $this->tenantId()]);
        $this->abrirCaja($empleado, $sucursal->id);
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        // Reemplaza el set de usuarios de la sucursal con una lista vacía — quitaría al empleado.
        $this->putJson(
            "/api/branch/{$sucursal->id}/users",
            ['user_ids' => []],
            $this->authHeaders($admin)
        )->assertJsonPath('status', 'error');

        $this->assertDatabaseHas('user_branch', ['user_id' => $empleado->id, 'branch_id' => $sucursal->id]);
    }
}
