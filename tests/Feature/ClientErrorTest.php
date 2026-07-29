<?php

namespace Tests\Feature;

use App\Enums\RoleEnum;
use App\Models\ErrorReporting;
use App\Models\User;
use Tests\TestCase;

class ClientErrorTest extends TestCase
{
    private function superAdminHeaders(): array
    {
        $user = User::where('rol_id', RoleEnum::SUPERADMIN->value)->first();

        return $this->authHeaders($user);
    }

    // ── Store (endpoint público) ──────────────────────────────

    public function test_registra_error_frontend(): void
    {
        $response = $this->postJson('/api/client-error', [
            'message' => 'Uncaught TypeError: Cannot read properties of null',
            'url' => '/dashboard',
            'context' => 'Dashboard',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertDatabaseHas('error_reporting', [
            'source' => 'frontend',
            'method' => 'CLIENT',
        ]);
    }

    public function test_error_requiere_mensaje(): void
    {
        $this->postJson('/api/client-error', [
            'url' => '/dashboard',
        ])->assertStatus(400); // ValidationException → custom handler → HTTP 400
    }

    public function test_error_con_todos_los_campos_opcionales(): void
    {
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $response = $this->postJson('/api/client-error', [
            'message' => 'Error completo',
            'stack' => "Error: mensaje\n  at fn (/app/main.js:10)",
            'url' => '/orders',
            'context' => 'OrderList',
            'level' => 'error',
            'tenant_slug' => 'pos-app',
            'user_id' => $user->id,
            'usuario' => $user->usuario,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK');
    }

    public function test_mensaje_muy_largo_es_rechazado(): void
    {
        $this->postJson('/api/client-error', [
            'message' => str_repeat('a', 1001),
        ])->assertStatus(400);
    }

    public function test_endpoint_es_publico_sin_autenticacion(): void
    {
        // No se pasan headers — el endpoint no requiere auth
        $this->postJson('/api/client-error', [
            'message' => 'Error público sin auth',
        ])->assertStatus(200);
    }

    // ── Index (solo superadmin) ───────────────────────────────

    public function test_index_requiere_autenticacion_superadmin(): void
    {
        $this->getJson('/api/super-admin/error-logs')
            ->assertStatus(401);
    }

    public function test_index_no_accesible_con_token_admin(): void
    {
        // Un admin normal no tiene acceso al panel superadmin
        $this->getJson('/api/super-admin/error-logs', $this->authHeaders())
            ->assertStatus(403);
    }

    public function test_index_retorna_errores_paginados_para_superadmin(): void
    {
        ErrorReporting::create([
            'source' => 'frontend',
            'endpoint' => '/dashboard',
            'method' => 'CLIENT',
            'status_code' => 0,
            'error_message' => 'Error de prueba',
        ]);

        $this->getJson('/api/super-admin/error-logs', $this->superAdminHeaders())
            ->assertStatus(206)
            ->assertJsonStructure(['current_page', 'data', 'total', 'per_page'])
            ->assertJsonPath('total', 1);
    }

    public function test_index_filtra_por_source(): void
    {
        ErrorReporting::create([
            'source' => 'frontend',
            'endpoint' => '/dashboard',
            'method' => 'CLIENT',
            'status_code' => 0,
            'error_message' => 'Error frontend',
        ]);

        ErrorReporting::create([
            'source' => 'backend',
            'endpoint' => '/api/order',
            'method' => 'POST',
            'status_code' => 500,
            'error_message' => 'Error backend',
        ]);

        $this->getJson('/api/super-admin/error-logs?source=frontend', $this->superAdminHeaders())
            ->assertStatus(206)
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.source', 'frontend');
    }

    public function test_index_ordena_por_mas_reciente_primero(): void
    {
        $viejo = ErrorReporting::create([
            'source' => 'backend',
            'endpoint' => '/api/order',
            'method' => 'POST',
            'status_code' => 500,
            'error_message' => 'Error viejo',
            'created_at' => now()->subDays(2),
        ]);

        $reciente = ErrorReporting::create([
            'source' => 'backend',
            'endpoint' => '/api/order',
            'method' => 'POST',
            'status_code' => 500,
            'error_message' => 'Error reciente',
            'created_at' => now(),
        ]);

        $response = $this->getJson('/api/super-admin/error-logs', $this->superAdminHeaders())
            ->assertStatus(206);

        $this->assertEquals($reciente->id, $response->json('data.0.id'));
        $this->assertEquals($viejo->id, $response->json('data.1.id'));
    }

    public function test_index_sin_errores_retorna_lista_vacia(): void
    {
        $this->getJson('/api/super-admin/error-logs', $this->superAdminHeaders())
            ->assertStatus(206)
            ->assertJsonPath('total', 0)
            ->assertJsonPath('data', []);
    }
}
