<?php

namespace Tests\Security;

use App\Enums\MainOrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BranchModel;
use App\Models\BusinessConfigModel;
use App\Models\MainOrderReportModel;
use App\Models\User;
use Tests\TestCase;

/**
 * Cubre la autorización del módulo de sucursales: gestión (CRUD) es exclusiva de Admin,
 * y la visibilidad de sucursales en /branch/list respeta el acceso otorgado vía
 * user_branch — Admin siempre ve todas, otros roles solo las que tienen asignadas.
 */
class BranchAuthorizationTest extends TestCase
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

    private function crearSucursal(string $name = 'Sucursal Test'): BranchModel
    {
        return BranchModel::create([
            BranchModel::NAME => $name,
            BranchModel::TENANT_ID => $this->tenantId(),
            BranchModel::ACTIVE => true,
        ]);
    }

    // ── Gestión (CRUD) — solo Admin ─────────────────────────────

    public function test_admin_puede_crear_sucursal(): void
    {
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->postJson('/api/branch', ['name' => 'Sucursal Centro'], $this->authHeaders($admin))
            ->assertStatus(200);

        $this->assertDatabaseHas('branches', [
            'name' => 'Sucursal Centro',
            'tenant_id' => $this->tenantId(),
        ]);
    }

    public function test_empleado_no_puede_crear_sucursal(): void
    {
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);

        $this->postJson('/api/branch', ['name' => 'Sucursal Centro'], $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    public function test_empleado_no_puede_listar_sucursales_en_admin_index(): void
    {
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);

        $this->getJson('/api/branch', $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    public function test_empleado_no_puede_asignar_usuarios_a_sucursal(): void
    {
        $sucursal = $this->crearSucursal();
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);

        $this->putJson("/api/branch/{$sucursal->id}/users", ['user_ids' => [$empleado->id]], $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    public function test_admin_puede_asignar_usuarios_a_sucursal(): void
    {
        $sucursal = $this->crearSucursal();
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);

        $this->putJson("/api/branch/{$sucursal->id}/users", ['user_ids' => [$empleado->id]], $this->authHeaders($admin))
            ->assertStatus(200);

        $this->assertDatabaseHas('user_branch', [
            'branch_id' => $sucursal->id,
            'user_id' => $empleado->id,
            'tenant_id' => $this->tenantId(),
        ]);
    }

    // ── /branch/list — visibilidad por acceso otorgado ──────────

    public function test_admin_ve_todas_las_sucursales_sin_asignacion_explicita(): void
    {
        $sucursalA = $this->crearSucursal('Sucursal A');
        $sucursalB = $this->crearSucursal('Sucursal B');
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $response = $this->getJson('/api/branch/list', $this->authHeaders($admin))->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('id');

        $this->assertTrue($ids->contains($sucursalA->id));
        $this->assertTrue($ids->contains($sucursalB->id));
    }

    public function test_empleado_solo_ve_sucursales_asignadas(): void
    {
        $sucursalAsignada = $this->crearSucursal('Sucursal Asignada');
        $sucursalNoAsignada = $this->crearSucursal('Sucursal No Asignada');
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);

        $sucursalAsignada->users()->attach($empleado->id, [BranchModel::TENANT_ID => $this->tenantId()]);

        $response = $this->getJson('/api/branch/list', $this->authHeaders($empleado))->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('id');

        $this->assertTrue($ids->contains($sucursalAsignada->id));
        $this->assertFalse($ids->contains($sucursalNoAsignada->id));
    }

    public function test_empleado_sin_ninguna_sucursal_asignada_no_ve_ninguna(): void
    {
        $this->crearSucursal('Sucursal Cualquiera');
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);

        $response = $this->getJson('/api/branch/list', $this->authHeaders($empleado))->assertStatus(200);

        $this->assertEmpty($response->json('data'));
    }

    // La activación (POST .../branches/enable) ahora es exclusiva de SuperAdmin —
    // ver tests/SuperAdmin/TenantBranchTest.php.

    // ── Guards de desactivación/eliminación ──────────────────────

    public function test_admin_puede_desactivar_sucursal_si_hay_otra_activa(): void
    {
        $this->crearSucursal('Otra');
        $sucursal = $this->crearSucursal('A desactivar');
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->putJson("/api/branch/{$sucursal->id}", ['name' => $sucursal->name, 'active' => false], $this->authHeaders($admin))
            ->assertStatus(200);

        $this->assertDatabaseHas('branches', ['id' => $sucursal->id, 'active' => false]);
    }

    public function test_no_puede_desactivar_la_unica_sucursal_activa(): void
    {
        $sucursal = $this->crearSucursal('Única');
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->putJson("/api/branch/{$sucursal->id}", ['name' => $sucursal->name, 'active' => false], $this->authHeaders($admin))
            ->assertJsonPath('status', 'error');

        $this->assertDatabaseHas('branches', ['id' => $sucursal->id, 'active' => true]);
    }

    public function test_no_puede_desactivar_sucursal_con_caja_abierta(): void
    {
        $this->crearSucursal('Otra');
        $sucursal = $this->crearSucursal('Con Caja Abierta');
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();
        MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN->value,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => $admin->id,
            MainOrderReportModel::TENANT_ID => $this->tenantId(),
            MainOrderReportModel::BRANCH_ID => $sucursal->id,
        ]);

        $this->putJson("/api/branch/{$sucursal->id}", ['name' => $sucursal->name, 'active' => false], $this->authHeaders($admin))
            ->assertJsonPath('status', 'error');

        $this->assertDatabaseHas('branches', ['id' => $sucursal->id, 'active' => true]);
    }

    public function test_no_puede_eliminar_la_unica_sucursal_activa(): void
    {
        $sucursal = $this->crearSucursal('Única');
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->deleteJson("/api/branch/{$sucursal->id}", [], $this->authHeaders($admin))
            ->assertJsonPath('status', 'error');

        $this->assertDatabaseHas('branches', ['id' => $sucursal->id, 'deleted_at' => null]);
    }

    public function test_puede_eliminar_sucursal_inactiva_aunque_sea_la_unica(): void
    {
        $sucursal = $this->crearSucursal('Inactiva');
        $sucursal->update([BranchModel::ACTIVE => false]);
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->deleteJson("/api/branch/{$sucursal->id}", [], $this->authHeaders($admin))
            ->assertStatus(200);
    }
}
