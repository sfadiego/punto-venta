<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Tests\TestCase;

class UserTest extends TestCase
{
    public function test_admin_lista_usuarios(): void
    {
        $response = $this->getJson('/api/admin/users', $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['status', 'data']);

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
}
