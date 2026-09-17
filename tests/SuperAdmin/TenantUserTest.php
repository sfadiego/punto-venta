<?php

namespace Tests\SuperAdmin;

use App\Enums\MainOrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BranchModel;
use App\Models\BusinessConfigModel;
use App\Models\MainOrderReportModel;
use App\Models\User;
use Tests\TestCase;

class TenantUserTest extends TestCase
{
    private function superAdminHeaders(): array
    {
        $user = User::where('rol_id', RoleEnum::SUPERADMIN->value)->first();

        return $this->authHeaders($user);
    }

    private function crearTenant(array $overrides = []): BusinessConfigModel
    {
        $slug = 'tenant-users-'.uniqid();

        return BusinessConfigModel::create(array_merge([
            BusinessConfigModel::SLUG => $slug,
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Tenant Para Usuarios',
            BusinessConfigModel::PRIMARY_COLOR => '#F59E0B',
            BusinessConfigModel::SIDEBAR_COLOR => '#1C1917',
            BusinessConfigModel::FONT_COLOR => '#FFFFFF',
            BusinessConfigModel::LABEL_COLOR => '#1C1917',
            BusinessConfigModel::SUBSCRIPTION_PLAN => 'lifetime',
        ], $overrides));
    }

    private function userPayload(array $overrides = []): array
    {
        return array_merge([
            'nombre' => 'Empleado',
            'apellido_paterno' => 'Test',
            'email' => 'empleado'.uniqid().'@test.com',
            'usuario' => 'emp-'.uniqid(),
            'password' => 'password123',
            'rol_id' => RoleEnum::EMPLOYE->value,
            'activo' => true,
        ], $overrides);
    }

    // ── Index ─────────────────────────────────────────────────

    public function test_lista_usuarios_del_tenant(): void
    {
        $tenant = BusinessConfigModel::first();

        $this->getJson("/api/super-admin/tenant/{$tenant->id}/users", $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['data']);
    }

    public function test_lista_no_incluye_superadmin(): void
    {
        $tenant = BusinessConfigModel::first();
        $response = $this->getJson("/api/super-admin/tenant/{$tenant->id}/users", $this->superAdminHeaders())
            ->assertStatus(200);

        $roles = array_column($response->json('data'), 'rol_id');
        $this->assertNotContains(RoleEnum::SUPERADMIN->value, $roles);
    }

    public function test_lista_usuarios_sin_autenticacion(): void
    {
        $tenant = BusinessConfigModel::first();
        $this->getJson("/api/super-admin/tenant/{$tenant->id}/users")->assertStatus(401);
    }

    public function test_lista_usuarios_sin_rol_superadmin(): void
    {
        $tenant = BusinessConfigModel::first();
        $this->getJson("/api/super-admin/tenant/{$tenant->id}/users", $this->authHeaders())->assertStatus(403);
    }

    // ── Store ─────────────────────────────────────────────────

    public function test_crea_usuario_en_tenant(): void
    {
        $tenant = $this->crearTenant();
        $payload = $this->userPayload();

        $this->postJson("/api/super-admin/tenant/{$tenant->id}/users", $payload, $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.email', $payload['email'])
            ->assertJsonPath('data.rol_id', RoleEnum::EMPLOYE->value);

        $this->assertDatabaseHas('users', [
            'email' => $payload['email'],
            'tenant_id' => $tenant->id,
        ]);
    }

    public function test_crea_usuario_con_sucursales_asignadas(): void
    {
        $tenant = $this->crearTenant();
        $sucursalA = BranchModel::create([
            BranchModel::NAME => 'Sucursal A', BranchModel::TENANT_ID => $tenant->id, BranchModel::ACTIVE => true,
        ]);
        $sucursalB = BranchModel::create([
            BranchModel::NAME => 'Sucursal B', BranchModel::TENANT_ID => $tenant->id, BranchModel::ACTIVE => true,
        ]);
        $payload = $this->userPayload(['branch_ids' => [$sucursalA->id, $sucursalB->id]]);

        $response = $this->postJson("/api/super-admin/tenant/{$tenant->id}/users", $payload, $this->superAdminHeaders())
            ->assertStatus(200);

        $userId = $response->json('data.id');

        $this->assertDatabaseHas('user_branch', [
            'user_id' => $userId, 'branch_id' => $sucursalA->id, 'tenant_id' => $tenant->id,
        ]);
        $this->assertDatabaseHas('user_branch', [
            'user_id' => $userId, 'branch_id' => $sucursalB->id, 'tenant_id' => $tenant->id,
        ]);
    }

    public function test_ignora_branch_ids_al_crear_un_admin(): void
    {
        $tenant = $this->crearTenant();
        $sucursal = BranchModel::create([
            BranchModel::NAME => 'Sucursal A', BranchModel::TENANT_ID => $tenant->id, BranchModel::ACTIVE => true,
        ]);
        $payload = $this->userPayload(['rol_id' => RoleEnum::ADMIN->value, 'branch_ids' => [$sucursal->id]]);

        $response = $this->postJson("/api/super-admin/tenant/{$tenant->id}/users", $payload, $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertDatabaseMissing('user_branch', ['user_id' => $response->json('data.id')]);
    }

    public function test_no_permite_branch_ids_de_otro_tenant(): void
    {
        $tenant = $this->crearTenant();
        $otroTenant = $this->crearTenant();
        $sucursalOtroTenant = BranchModel::create([
            BranchModel::NAME => 'Sucursal Ajena', BranchModel::TENANT_ID => $otroTenant->id, BranchModel::ACTIVE => true,
        ]);
        $payload = $this->userPayload(['branch_ids' => [$sucursalOtroTenant->id]]);

        $this->postJson("/api/super-admin/tenant/{$tenant->id}/users", $payload, $this->superAdminHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_usuario_sin_nombre(): void
    {
        $tenant = $this->crearTenant();

        $this->postJson("/api/super-admin/tenant/{$tenant->id}/users", $this->userPayload(['nombre' => '']), $this->superAdminHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_usuario_sin_email(): void
    {
        $tenant = $this->crearTenant();

        $this->postJson("/api/super-admin/tenant/{$tenant->id}/users", $this->userPayload(['email' => '']), $this->superAdminHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_usuario_con_email_duplicado(): void
    {
        $tenant = $this->crearTenant();
        $existing = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->postJson("/api/super-admin/tenant/{$tenant->id}/users", $this->userPayload([
            'email' => $existing->email,
        ]), $this->superAdminHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_usuario_con_usuario_duplicado(): void
    {
        $tenant = $this->crearTenant();
        $existing = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->postJson("/api/super-admin/tenant/{$tenant->id}/users", $this->userPayload([
            'usuario' => $existing->usuario,
        ]), $this->superAdminHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_usuario_con_rol_invalido(): void
    {
        $tenant = $this->crearTenant();

        $this->postJson("/api/super-admin/tenant/{$tenant->id}/users", $this->userPayload([
            'rol_id' => 99,
        ]), $this->superAdminHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_usuario_sin_autenticacion(): void
    {
        $tenant = $this->crearTenant();
        $this->postJson("/api/super-admin/tenant/{$tenant->id}/users", $this->userPayload())
            ->assertStatus(401);
    }

    // ── Update ────────────────────────────────────────────────

    public function test_actualiza_usuario_del_tenant(): void
    {
        $tenant = $this->crearTenant();
        $payload = $this->userPayload();
        $created = $this->postJson("/api/super-admin/tenant/{$tenant->id}/users", $payload, $this->superAdminHeaders())
            ->json('data');

        $this->putJson("/api/super-admin/tenant/{$tenant->id}/users/{$created['id']}", [
            'nombre' => 'Actualizado',
            'apellido_paterno' => 'Test',
            'email' => $payload['email'],
            'usuario' => $payload['usuario'],
            'rol_id' => RoleEnum::EMPLOYE->value,
        ], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.nombre', 'Actualizado');
    }

    public function test_actualiza_password_si_se_envia(): void
    {
        $tenant = $this->crearTenant();
        $payload = $this->userPayload();
        $created = $this->postJson("/api/super-admin/tenant/{$tenant->id}/users", $payload, $this->superAdminHeaders())
            ->json('data');

        $this->putJson("/api/super-admin/tenant/{$tenant->id}/users/{$created['id']}", [
            'nombre' => $created['nombre'],
            'apellido_paterno' => $created['apellido_paterno'],
            'email' => $payload['email'],
            'usuario' => $payload['usuario'],
            'rol_id' => RoleEnum::EMPLOYE->value,
            'password' => 'nuevapass123',
        ], $this->superAdminHeaders())
            ->assertStatus(200);
    }

    public function test_no_actualiza_usuario_de_otro_tenant(): void
    {
        $tenant1 = $this->crearTenant();
        $tenant2 = $this->crearTenant();

        $payload = $this->userPayload();
        $user = $this->postJson("/api/super-admin/tenant/{$tenant1->id}/users", $payload, $this->superAdminHeaders())
            ->json('data');

        // Intentar actualizar usuario del tenant1 desde el endpoint del tenant2
        $this->putJson("/api/super-admin/tenant/{$tenant2->id}/users/{$user['id']}", [
            'nombre' => 'Hack',
            'apellido_paterno' => 'Test',
            'email' => $payload['email'],
            'usuario' => $payload['usuario'],
            'rol_id' => RoleEnum::EMPLOYE->value,
        ], $this->superAdminHeaders())
            ->assertStatus(404);
    }

    public function test_actualiza_usuario_sin_autenticacion(): void
    {
        $tenant = BusinessConfigModel::first();
        $user = User::where('tenant_id', $tenant->id)->first();

        $this->putJson("/api/super-admin/tenant/{$tenant->id}/users/{$user->id}", [])
            ->assertStatus(401);
    }

    // ── Seed users ────────────────────────────────────────────

    public function test_seed_usuarios_del_tenant(): void
    {
        $tenant = $this->crearTenant();

        $response = $this->postJson("/api/super-admin/tenant/{$tenant->id}/users/seed", [], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['data' => ['created', 'skipped']]);

        $this->assertIsArray($response->json('data.created'));
        $this->assertNotEmpty($response->json('data.created'));
    }

    public function test_seed_segunda_vez_omite_existentes(): void
    {
        $tenant = $this->crearTenant();

        $this->postJson("/api/super-admin/tenant/{$tenant->id}/users/seed", [], $this->superAdminHeaders());

        $second = $this->postJson("/api/super-admin/tenant/{$tenant->id}/users/seed", [], $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertEmpty($second->json('data.created'));
        $this->assertNotEmpty($second->json('data.skipped'));
    }

    public function test_seed_sin_autenticacion(): void
    {
        $tenant = BusinessConfigModel::first();
        $this->postJson("/api/super-admin/tenant/{$tenant->id}/users/seed")->assertStatus(401);
    }

    public function test_seed_autoasigna_unica_sucursal_a_roles_no_admin(): void
    {
        $tenant = $this->crearTenant();
        $sucursal = BranchModel::create([
            BranchModel::NAME => 'Única', BranchModel::TENANT_ID => $tenant->id, BranchModel::ACTIVE => true,
        ]);

        $this->postJson("/api/super-admin/tenant/{$tenant->id}/users/seed", [], $this->superAdminHeaders())
            ->assertStatus(200);

        $admin = User::withoutGlobalScopes()->where(User::TENANT_ID, $tenant->id)->where(User::ROL_ID, RoleEnum::ADMIN->value)->first();
        $empleado = User::withoutGlobalScopes()->where(User::TENANT_ID, $tenant->id)->where(User::ROL_ID, RoleEnum::EMPLOYE->value)->first();

        $this->assertDatabaseMissing('user_branch', ['user_id' => $admin->id]);
        $this->assertDatabaseHas('user_branch', [
            'user_id' => $empleado->id, 'branch_id' => $sucursal->id, 'tenant_id' => $tenant->id,
        ]);
    }

    public function test_seed_exige_branch_id_si_hay_varias_sucursales(): void
    {
        $tenant = $this->crearTenant();
        BranchModel::create([BranchModel::NAME => 'A', BranchModel::TENANT_ID => $tenant->id, BranchModel::ACTIVE => true]);
        BranchModel::create([BranchModel::NAME => 'B', BranchModel::TENANT_ID => $tenant->id, BranchModel::ACTIVE => true]);

        $this->postJson("/api/super-admin/tenant/{$tenant->id}/users/seed", [], $this->superAdminHeaders())
            ->assertStatus(400);

        $this->assertDatabaseMissing('users', ['tenant_id' => $tenant->id, 'rol_id' => RoleEnum::EMPLOYE->value]);
    }

    public function test_seed_asigna_la_sucursal_elegida_con_varias_disponibles(): void
    {
        $tenant = $this->crearTenant();
        BranchModel::create([BranchModel::NAME => 'A', BranchModel::TENANT_ID => $tenant->id, BranchModel::ACTIVE => true]);
        $sucursalB = BranchModel::create([BranchModel::NAME => 'B', BranchModel::TENANT_ID => $tenant->id, BranchModel::ACTIVE => true]);

        $this->postJson("/api/super-admin/tenant/{$tenant->id}/users/seed", [
            'branch_id' => $sucursalB->id,
        ], $this->superAdminHeaders())->assertStatus(200);

        $empleado = User::withoutGlobalScopes()->where(User::TENANT_ID, $tenant->id)->where(User::ROL_ID, RoleEnum::EMPLOYE->value)->first();
        $admin = User::withoutGlobalScopes()->where(User::TENANT_ID, $tenant->id)->where(User::ROL_ID, RoleEnum::ADMIN->value)->first();

        $this->assertDatabaseHas('user_branch', [
            'user_id' => $empleado->id, 'branch_id' => $sucursalB->id, 'tenant_id' => $tenant->id,
        ]);
        $this->assertDatabaseMissing('user_branch', ['user_id' => $admin->id]);
    }

    // ── Delete ────────────────────────────────────────────────

    public function test_elimina_usuario_del_tenant(): void
    {
        $tenant = $this->crearTenant();
        $payload = $this->userPayload();
        $created = $this->postJson("/api/super-admin/tenant/{$tenant->id}/users", $payload, $this->superAdminHeaders())
            ->json('data');

        $this->deleteJson("/api/super-admin/tenant/{$tenant->id}/users/{$created['id']}", [], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertDatabaseMissing('users', ['id' => $created['id']]);
    }

    public function test_no_elimina_usuario_de_otro_tenant(): void
    {
        $tenant1 = $this->crearTenant();
        $tenant2 = $this->crearTenant();

        $user = $this->postJson("/api/super-admin/tenant/{$tenant1->id}/users", $this->userPayload(), $this->superAdminHeaders())
            ->json('data');

        $this->deleteJson("/api/super-admin/tenant/{$tenant2->id}/users/{$user['id']}", [], $this->superAdminHeaders())
            ->assertStatus(404);
    }

    public function test_elimina_sin_autenticacion(): void
    {
        $tenant = BusinessConfigModel::first();
        $user = User::where('tenant_id', $tenant->id)->first();

        $this->deleteJson("/api/super-admin/tenant/{$tenant->id}/users/{$user->id}")
            ->assertStatus(401);
    }

    // ── Login lock (rate limit) ──────────────────────────────────

    public function test_estado_de_bloqueo_sin_intentos_previos(): void
    {
        $tenant = $this->crearTenant();
        $payload = $this->userPayload();
        $created = $this->postJson("/api/super-admin/tenant/{$tenant->id}/users", $payload, $this->superAdminHeaders())
            ->json('data');

        $this->getJson("/api/super-admin/tenant/{$tenant->id}/users/{$created['id']}/login-lock", $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.blocked', false)
            ->assertJsonPath('data.ips', []);
    }

    public function test_estado_de_bloqueo_tras_intentos_fallidos(): void
    {
        $tenant = $this->crearTenant();
        $payload = $this->userPayload();
        $created = $this->postJson("/api/super-admin/tenant/{$tenant->id}/users", $payload, $this->superAdminHeaders())
            ->json('data');

        // El límite es 5/minuto: se necesita un 6to intento para disparar el bloqueo
        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/auth/login', [
                'email' => $payload['email'],
                'password' => 'password_incorrecta',
            ]);
        }

        $this->getJson("/api/super-admin/tenant/{$tenant->id}/users/{$created['id']}/login-lock", $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.blocked', true);
    }

    public function test_desbloquea_acceso_de_usuario(): void
    {
        $tenant = $this->crearTenant();
        $payload = $this->userPayload();
        $created = $this->postJson("/api/super-admin/tenant/{$tenant->id}/users", $payload, $this->superAdminHeaders())
            ->json('data');

        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/auth/login', [
                'email' => $payload['email'],
                'password' => 'password_incorrecta',
            ]);
        }

        $this->deleteJson("/api/super-admin/tenant/{$tenant->id}/users/{$created['id']}/login-lock", [], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.cleared', 1);

        // Tras desbloquear, el estado ya no debe reportar bloqueo
        $this->getJson("/api/super-admin/tenant/{$tenant->id}/users/{$created['id']}/login-lock", $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.blocked', false);
    }

    public function test_login_lock_sin_autenticacion(): void
    {
        $tenant = BusinessConfigModel::first();
        $user = User::where('tenant_id', $tenant->id)->first();

        $this->getJson("/api/super-admin/tenant/{$tenant->id}/users/{$user->id}/login-lock")
            ->assertStatus(401);
        $this->deleteJson("/api/super-admin/tenant/{$tenant->id}/users/{$user->id}/login-lock")
            ->assertStatus(401);
    }

    // ── branches / syncBranches ──────────────────────────────────

    public function test_consulta_sucursales_de_un_usuario(): void
    {
        $tenant = $this->crearTenant();
        $sucursal = BranchModel::create([BranchModel::NAME => 'A', BranchModel::TENANT_ID => $tenant->id, BranchModel::ACTIVE => true]);
        $created = $this->postJson(
            "/api/super-admin/tenant/{$tenant->id}/users",
            $this->userPayload(['branch_ids' => [$sucursal->id]]),
            $this->superAdminHeaders()
        )->json('data');

        $this->getJson("/api/super-admin/tenant/{$tenant->id}/users/{$created['id']}/branches", $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.is_admin', false)
            ->assertJsonPath('data.branch_ids', [$sucursal->id]);
    }

    public function test_actualiza_sucursales_de_un_usuario(): void
    {
        $tenant = $this->crearTenant();
        $sucursalA = BranchModel::create([BranchModel::NAME => 'A', BranchModel::TENANT_ID => $tenant->id, BranchModel::ACTIVE => true]);
        $sucursalB = BranchModel::create([BranchModel::NAME => 'B', BranchModel::TENANT_ID => $tenant->id, BranchModel::ACTIVE => true]);
        $created = $this->postJson(
            "/api/super-admin/tenant/{$tenant->id}/users",
            $this->userPayload(['branch_ids' => [$sucursalA->id]]),
            $this->superAdminHeaders()
        )->json('data');

        $this->putJson(
            "/api/super-admin/tenant/{$tenant->id}/users/{$created['id']}/branches",
            ['branch_ids' => [$sucursalB->id]],
            $this->superAdminHeaders()
        )->assertStatus(200)->assertJsonPath('data.branch_ids', [$sucursalB->id]);

        $this->assertDatabaseMissing('user_branch', ['user_id' => $created['id'], 'branch_id' => $sucursalA->id]);
        $this->assertDatabaseHas('user_branch', ['user_id' => $created['id'], 'branch_id' => $sucursalB->id]);
    }

    public function test_no_permite_asignar_sucursales_a_un_admin(): void
    {
        $tenant = $this->crearTenant();
        $sucursal = BranchModel::create([BranchModel::NAME => 'A', BranchModel::TENANT_ID => $tenant->id, BranchModel::ACTIVE => true]);
        $admin = $this->postJson(
            "/api/super-admin/tenant/{$tenant->id}/users",
            $this->userPayload(['rol_id' => RoleEnum::ADMIN->value]),
            $this->superAdminHeaders()
        )->json('data');

        $this->putJson(
            "/api/super-admin/tenant/{$tenant->id}/users/{$admin['id']}/branches",
            ['branch_ids' => [$sucursal->id]],
            $this->superAdminHeaders()
        )->assertJsonPath('status', 'error');

        $this->assertDatabaseMissing('user_branch', ['user_id' => $admin['id']]);
    }

    public function test_no_permite_quitar_sucursal_con_caja_abierta_del_usuario(): void
    {
        $tenant = $this->crearTenant();
        $sucursalA = BranchModel::create([BranchModel::NAME => 'A', BranchModel::TENANT_ID => $tenant->id, BranchModel::ACTIVE => true]);
        $sucursalB = BranchModel::create([BranchModel::NAME => 'B', BranchModel::TENANT_ID => $tenant->id, BranchModel::ACTIVE => true]);
        $created = $this->postJson(
            "/api/super-admin/tenant/{$tenant->id}/users",
            $this->userPayload(['branch_ids' => [$sucursalA->id, $sucursalB->id]]),
            $this->superAdminHeaders()
        )->json('data');

        MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN->value,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => $created['id'],
            MainOrderReportModel::TENANT_ID => $tenant->id,
            MainOrderReportModel::BRANCH_ID => $sucursalA->id,
        ]);

        $this->putJson(
            "/api/super-admin/tenant/{$tenant->id}/users/{$created['id']}/branches",
            ['branch_ids' => [$sucursalB->id]],
            $this->superAdminHeaders()
        )->assertJsonPath('status', 'error');

        $this->assertDatabaseHas('user_branch', ['user_id' => $created['id'], 'branch_id' => $sucursalA->id]);
    }
}
