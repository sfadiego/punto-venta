<?php

namespace Tests\Admin;

use App\Enums\BusinessTypeEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\User;
use Tests\TestCase;

class UserTest extends TestCase
{
    public function test_admin_lista_usuarios(): void
    {
        $response = $this->getJson('/api/admin/users', $this->authHeaders());

        // UserService extiende DataTable → retorna 206 con estructura paginada
        $response->assertStatus(206)
            ->assertJsonStructure(['current_page', 'data', 'total', 'per_page']);

        $this->assertIsArray($response->json('data'));
        $this->assertNotEmpty($response->json('data'));
    }

    public function test_admin_muestra_usuario(): void
    {
        $user = User::first();

        $response = $this->getJson("/api/admin/users/{$user->id}", $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email);
    }

    public function test_show_retorna_objeto_no_lista(): void
    {
        $user = User::first();

        $response = $this->getJson("/api/admin/users/{$user->id}", $this->authHeaders());

        // Verifica que retorna un objeto, no un array de usuarios (bug anterior: devolvía User::all())
        $data = $response->json('data');
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayNotHasKey(0, $data);
    }

    public function test_ruta_users_sin_admin_prefix_no_existe(): void
    {
        $user = User::first();

        $this->getJson("/api/users/{$user->id}", $this->authHeaders())
            ->assertStatus(404);
    }

    public function test_sin_token_no_accede_a_usuarios(): void
    {
        $this->getJson('/api/admin/users')->assertStatus(401);
    }

    // ── Store ────────────────────────────────────────────────

    private function payloadNuevoUsuario(array $overrides = []): array
    {
        return array_merge([
            'nombre' => 'Nuevo',
            'apellido_paterno' => 'Empleado',
            'email' => 'nuevo-'.uniqid().'@test.com',
            'usuario' => 'nuevo-'.uniqid(),
            'password' => 'Password123',
            'rol_id' => RoleEnum::EMPLOYE->value,
            'activo' => true,
        ], $overrides);
    }

    public function test_crea_usuario_dentro_del_limite(): void
    {
        $tenant = BusinessConfigModel::first();
        $tenant->update([BusinessConfigModel::MAX_USERS => 10]);

        $response = $this->postJson('/api/admin/users', $this->payloadNuevoUsuario(), $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertDatabaseHas('users', [
            'id' => $response->json('data.id'),
            'tenant_id' => $tenant->id,
            'rol_id' => RoleEnum::EMPLOYE->value,
        ]);
    }

    public function test_no_crea_usuario_si_se_alcanzo_el_limite_del_plan(): void
    {
        $tenant = BusinessConfigModel::first();
        $currentCount = User::where('tenant_id', $tenant->id)->count();
        $tenant->update([BusinessConfigModel::MAX_USERS => $currentCount]);

        $this->postJson('/api/admin/users', $this->payloadNuevoUsuario(), $this->authHeaders())
            ->assertStatus(422);

        $this->assertDatabaseMissing('users', ['email' => $this->payloadNuevoUsuario()['email']]);
    }

    public function test_crea_usuario_justo_al_liberar_espacio_del_limite(): void
    {
        $tenant = BusinessConfigModel::first();
        $currentCount = User::where('tenant_id', $tenant->id)->count();
        $tenant->update([BusinessConfigModel::MAX_USERS => $currentCount + 1]);

        $this->postJson('/api/admin/users', $this->payloadNuevoUsuario(), $this->authHeaders())
            ->assertStatus(200);

        $this->postJson('/api/admin/users', $this->payloadNuevoUsuario(), $this->authHeaders())
            ->assertStatus(422);
    }

    public function test_no_crea_usuario_con_rol_superadmin(): void
    {
        $this->postJson('/api/admin/users', $this->payloadNuevoUsuario([
            'rol_id' => RoleEnum::SUPERADMIN->value,
        ]), $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_venta_por_peso_no_crea_usuario_con_rol_cocina(): void
    {
        $tenant = BusinessConfigModel::first();
        $tenant->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::VentaPorPeso]);

        $this->postJson('/api/admin/users', $this->payloadNuevoUsuario([
            'rol_id' => RoleEnum::COCINA->value,
        ]), $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_usuario_sin_campos_requeridos(): void
    {
        $this->postJson('/api/admin/users', [], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_usuario_con_email_duplicado(): void
    {
        $existing = User::first();

        $this->postJson('/api/admin/users', $this->payloadNuevoUsuario([
            'email' => $existing->email,
        ]), $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_empleado_no_puede_crear_usuarios(): void
    {
        $empleado = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();

        $this->postJson('/api/admin/users', $this->payloadNuevoUsuario(), $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    public function test_store_sin_token_no_accede(): void
    {
        $this->postJson('/api/admin/users', $this->payloadNuevoUsuario())
            ->assertStatus(401);
    }

    // ── Update ───────────────────────────────────────────────

    public function test_actualiza_usuario(): void
    {
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $response = $this->putJson("/api/admin/users/{$user->id}", [
            'nombre' => 'Nombre Actualizado',
            'apellido_paterno' => $user->apellido_paterno ?? 'Paterno',
            'apellido_materno' => 'Materno',
            'email' => $user->email,
            'usuario' => $user->usuario,
            'rol_id' => RoleEnum::ADMIN->value,
            'activo' => true,
        ], $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.nombre', 'Nombre Actualizado');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'nombre' => 'Nombre Actualizado']);
    }

    public function test_actualiza_password_de_usuario(): void
    {
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->putJson("/api/admin/users/{$user->id}", [
            'nombre' => $user->nombre,
            'apellido_paterno' => $user->apellido_paterno ?? 'Paterno',
            'apellido_materno' => 'Materno',
            'email' => $user->email,
            'usuario' => $user->usuario,
            'rol_id' => RoleEnum::ADMIN->value,
            'activo' => true,
            'password' => 'NuevaClave1',
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_actualiza_usuario_sin_campos_requeridos_falla(): void
    {
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->putJson("/api/admin/users/{$user->id}", [], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_actualiza_usuario_email_duplicado_falla(): void
    {
        $users = User::where('rol_id', RoleEnum::ADMIN->value)->take(2)->get();

        if ($users->count() < 2) {
            $this->markTestSkipped('Se necesitan al menos 2 usuarios admin para este test.');
        }

        $userA = $users->first();
        $userB = $users->last();

        $this->putJson("/api/admin/users/{$userA->id}", [
            'nombre' => $userA->nombre,
            'apellido_paterno' => $userA->apellido_paterno,
            'email' => $userB->email,
            'usuario' => $userA->usuario,
            'rol_id' => RoleEnum::ADMIN->value,
            'activo' => true,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_actualiza_usuario_inexistente_retorna_404(): void
    {
        $this->putJson('/api/admin/users/99999', [
            'nombre' => 'Ghost',
            'apellido_paterno' => 'User',
            'email' => 'ghost@test.com',
            'usuario' => 'ghost_user',
            'rol_id' => RoleEnum::ADMIN->value,
            'activo' => true,
        ], $this->authHeaders())
            ->assertStatus(404);
    }

    public function test_update_sin_token_no_accede(): void
    {
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->putJson("/api/admin/users/{$user->id}", [])->assertStatus(401);
    }
}
