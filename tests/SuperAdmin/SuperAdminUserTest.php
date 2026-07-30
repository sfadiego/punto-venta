<?php

namespace Tests\SuperAdmin;

use App\Enums\RoleEnum;
use App\Models\User;
use Tests\TestCase;

class SuperAdminUserTest extends TestCase
{
    private function superAdminHeaders(): array
    {
        $user = User::where('rol_id', RoleEnum::SUPERADMIN->value)->first();

        return $this->authHeaders($user);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'nombre' => 'Nuevo',
            'apellido_paterno' => 'Super',
            'email' => 'nuevo-super-'.uniqid().'@test.com',
            'usuario' => 'nuevo-super-'.uniqid(),
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
        ], $overrides);
    }

    // ── Index ─────────────────────────────────────────────────

    public function test_lista_superadmins(): void
    {
        $this->getJson('/api/super-admin/super-admins', $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_sin_autenticacion_no_lista(): void
    {
        $this->getJson('/api/super-admin/super-admins')->assertStatus(401);
    }

    // ── Store ─────────────────────────────────────────────────

    public function test_crea_nuevo_superadmin(): void
    {
        $response = $this->postJson('/api/super-admin/super-admins', $this->payload(), $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.rol_id', RoleEnum::SUPERADMIN->value);

        $this->assertDatabaseHas('users', [
            'id' => $response->json('data.id'),
            'rol_id' => RoleEnum::SUPERADMIN->value,
        ]);
    }

    public function test_ignora_rol_id_enviado_por_el_cliente(): void
    {
        // Nunca debe poder crearse con un rol distinto a SUPERADMIN vía este endpoint,
        // sin importar qué envíe el cliente en el body.
        $response = $this->postJson('/api/super-admin/super-admins', $this->payload([
            'rol_id' => RoleEnum::EMPLOYE->value,
        ]), $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertDatabaseHas('users', [
            'id' => $response->json('data.id'),
            'rol_id' => RoleEnum::SUPERADMIN->value,
        ]);
    }

    public function test_requiere_campos_obligatorios(): void
    {
        $this->postJson('/api/super-admin/super-admins', [], $this->superAdminHeaders())
            ->assertStatus(400);
    }

    public function test_email_duplicado_falla(): void
    {
        $existing = User::first();

        $this->postJson('/api/super-admin/super-admins', $this->payload([
            'email' => $existing->email,
        ]), $this->superAdminHeaders())
            ->assertStatus(400);
    }

    public function test_password_sin_letras_y_numeros_falla(): void
    {
        $this->postJson('/api/super-admin/super-admins', $this->payload([
            'password' => 'sololetras',
            'password_confirmation' => 'sololetras',
        ]), $this->superAdminHeaders())
            ->assertStatus(400);
    }

    public function test_sin_autenticacion_no_crea(): void
    {
        $this->postJson('/api/super-admin/super-admins', $this->payload())
            ->assertStatus(401);
    }

    public function test_admin_de_tenant_no_puede_crear_superadmins(): void
    {
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->postJson('/api/super-admin/super-admins', $this->payload(), $this->authHeaders($admin))
            ->assertStatus(403);
    }

    // ── Update ────────────────────────────────────────────────

    private function crearSuperAdmin(array $overrides = []): User
    {
        return User::create(array_merge([
            User::NOMBRE => 'Super',
            User::APELLIDO_PATERNO => 'Existente',
            User::APELLIDO_MATERNO => '',
            User::EMAIL => 'super-existente-'.uniqid().'@test.com',
            User::USUARIO => 'super-existente-'.uniqid(),
            User::PASSWORD => \Illuminate\Support\Facades\Hash::make('ClaveActual1'),
            User::ROL_ID => RoleEnum::SUPERADMIN->value,
            User::ACTIVO => true,
            User::TENANT_ID => 1,
        ], $overrides));
    }

    public function test_actualiza_datos_de_un_superadmin(): void
    {
        $superAdmin = $this->crearSuperAdmin();

        $this->putJson("/api/super-admin/super-admins/{$superAdmin->id}", [
            'nombre' => 'Nombre Actualizado',
            'apellido_paterno' => $superAdmin->apellido_paterno,
            'email' => $superAdmin->email,
            'usuario' => $superAdmin->usuario,
        ], $this->superAdminHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.nombre', 'Nombre Actualizado');

        $this->assertDatabaseHas('users', ['id' => $superAdmin->id, 'nombre' => 'Nombre Actualizado']);
    }

    public function test_actualiza_contrasena_de_un_superadmin(): void
    {
        $superAdmin = $this->crearSuperAdmin();

        $this->putJson("/api/super-admin/super-admins/{$superAdmin->id}", [
            'nombre' => $superAdmin->nombre,
            'apellido_paterno' => $superAdmin->apellido_paterno,
            'email' => $superAdmin->email,
            'usuario' => $superAdmin->usuario,
            'password' => 'ClaveNueva2',
            'password_confirmation' => 'ClaveNueva2',
        ], $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('ClaveNueva2', $superAdmin->fresh()->password));
    }

    public function test_password_vacio_conserva_la_actual(): void
    {
        $superAdmin = $this->crearSuperAdmin();

        $this->putJson("/api/super-admin/super-admins/{$superAdmin->id}", [
            'nombre' => $superAdmin->nombre,
            'apellido_paterno' => $superAdmin->apellido_paterno,
            'email' => $superAdmin->email,
            'usuario' => $superAdmin->usuario,
        ], $this->superAdminHeaders())
            ->assertStatus(200);

        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('ClaveActual1', $superAdmin->fresh()->password));
    }

    public function test_no_actualiza_usuario_que_no_es_superadmin(): void
    {
        $empleado = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();

        $this->putJson("/api/super-admin/super-admins/{$empleado->id}", [
            'nombre' => 'Intento',
            'apellido_paterno' => 'Intento',
            'email' => $empleado->email,
            'usuario' => $empleado->usuario,
        ], $this->superAdminHeaders())
            ->assertStatus(404);
    }

    public function test_actualizar_usuario_inexistente_retorna_404(): void
    {
        $this->putJson('/api/super-admin/super-admins/99999', [
            'nombre' => 'Ghost',
            'apellido_paterno' => 'User',
            'email' => 'ghost@test.com',
            'usuario' => 'ghost_user',
        ], $this->superAdminHeaders())
            ->assertStatus(404);
    }

    public function test_sin_autenticacion_no_actualiza(): void
    {
        $superAdmin = $this->crearSuperAdmin();

        $this->putJson("/api/super-admin/super-admins/{$superAdmin->id}", [
            'nombre' => 'Hackeado',
            'apellido_paterno' => $superAdmin->apellido_paterno,
            'email' => $superAdmin->email,
            'usuario' => $superAdmin->usuario,
        ])->assertStatus(401);
    }

    public function test_admin_de_tenant_no_puede_actualizar_superadmins(): void
    {
        $superAdmin = $this->crearSuperAdmin();
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->putJson("/api/super-admin/super-admins/{$superAdmin->id}", [
            'nombre' => 'Hackeado',
            'apellido_paterno' => $superAdmin->apellido_paterno,
            'email' => $superAdmin->email,
            'usuario' => $superAdmin->usuario,
        ], $this->authHeaders($admin))
            ->assertStatus(403);
    }
}
