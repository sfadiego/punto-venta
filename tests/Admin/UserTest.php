<?php

namespace Tests\Admin;

use App\Enums\RoleEnum;
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
