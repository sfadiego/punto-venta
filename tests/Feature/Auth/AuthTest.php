<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_login_con_credenciales_validas(): void
    {
        $user = User::where('rol_id', 1)->first();

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => env('APP_ADMIN_PASSWORD'),
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure([
                'status',
                'data' => ['access_token', 'user'],
            ]);
    }

    public function test_login_con_password_incorrecta(): void
    {
        // Email válido + password incorrecta → pasa validación, falla Auth::attempt → Response::error 422
        $user = User::where('rol_id', 1)->first();

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password_incorrecta',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error');
    }

    public function test_login_con_email_inexistente_falla_validacion(): void
    {
        // Email inexistente falla la regla exists:users,email → ValidationException → 400
        $response = $this->postJson('/api/auth/login', [
            'email' => 'noexiste@example.com',
            'password' => 'cualquiera',
        ]);

        $response->assertStatus(400);
    }

    public function test_login_requiere_email_y_password(): void
    {
        // Validación vacía → 400 (custom handler)
        $this->postJson('/api/auth/login', [])
            ->assertStatus(400);
    }

    public function test_rutas_protegidas_requieren_token(): void
    {
        $this->getJson('/api/category')->assertStatus(401);
    }
}
