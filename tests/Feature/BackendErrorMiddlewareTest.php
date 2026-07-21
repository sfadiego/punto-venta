<?php

namespace Tests\Feature;

use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\ErrorReporting;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Tests for the ErrorReporting middleware — verifies that the new columns
 * (stack_trace, user_id, tenant_slug) are persisted correctly on errors.
 *
 * Note on middleware order: the ErrorReporting middleware is in the 'api' group.
 * Routes from routes/api.php have auth:sanctum listed BEFORE the api group in
 * the raw middleware array, which means auth:sanctum runs first. When auth:sanctum
 * rejects a request (401), ErrorReporting is never reached for those routes.
 * To test ErrorReporting behavior, we register routes that explicitly put the
 * 'api' group first so ErrorReporting wraps auth:sanctum.
 */
class BackendErrorMiddlewareTest extends TestCase
{
    private function routeThatThrows(string $message = 'Error de prueba del middleware'): void
    {
        // 'api' group listed first → ErrorReporting wraps auth:sanctum in the pipeline
        Route::get('/api/test-backend-500', function () use ($message) {
            throw new \RuntimeException($message);
        })->middleware(['api', 'auth:sanctum']);
    }

    public function test_middleware_captura_stack_trace_en_error_500(): void
    {
        $this->routeThatThrows();

        $this->getJson('/api/test-backend-500', $this->authHeaders())
            ->assertStatus(500);

        $record = ErrorReporting::where('error_message', 'Error de prueba del middleware')->first();
        $this->assertNotNull($record);
        $this->assertNotNull($record->stack_trace);
        $this->assertStringContainsString('#0', $record->stack_trace);
    }

    public function test_middleware_captura_user_id_del_usuario_autenticado(): void
    {
        $this->routeThatThrows('Error con usuario');

        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->getJson('/api/test-backend-500', $this->authHeaders($user))
            ->assertStatus(500);

        $record = ErrorReporting::where('error_message', 'Error con usuario')->first();
        $this->assertNotNull($record);
        $this->assertEquals($user->id, $record->user_id);
    }

    public function test_middleware_captura_tenant_slug(): void
    {
        $this->routeThatThrows('Error con tenant');

        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();
        $tenant = BusinessConfigModel::first();

        $this->getJson('/api/test-backend-500', $this->authHeaders($user))
            ->assertStatus(500);

        $record = ErrorReporting::where('error_message', 'Error con tenant')->first();
        $this->assertNotNull($record);
        $this->assertEquals($tenant->slug, $record->tenant_slug);
    }

    public function test_middleware_guarda_endpoint_y_metodo_en_500(): void
    {
        $this->routeThatThrows('Error endpoint y metodo');

        $this->getJson('/api/test-backend-500', $this->authHeaders())
            ->assertStatus(500);

        $this->assertDatabaseHas('error_reporting', [
            'source' => 'backend',
            'method' => 'GET',
            'endpoint' => 'api/test-backend-500',
            'status_code' => 500,
            'error_message' => 'Error endpoint y metodo',
        ]);
    }

    public function test_middleware_user_id_es_null_sin_autenticacion(): void
    {
        // Sin auth:sanctum en la ruta el middleware corre aunque no haya token
        Route::get('/api/test-public-500', function () {
            throw new \RuntimeException('Error público sin auth');
        })->middleware(['api']);

        $this->getJson('/api/test-public-500')
            ->assertStatus(500);

        $record = ErrorReporting::where('error_message', 'Error público sin auth')->first();
        $this->assertNotNull($record);
        $this->assertNull($record->user_id);
        $this->assertNull($record->tenant_slug);
    }

    public function test_middleware_no_guarda_errores_400_exactos(): void
    {
        // El middleware usa status > 400 (estricto); el 400 de validación NO se persiste
        $before = ErrorReporting::where('status_code', 400)->count();

        $this->postJson('/api/client-error', []) // falta 'message' → ValidationException → 400
            ->assertStatus(400);

        $after = ErrorReporting::where('status_code', 400)->count();
        $this->assertEquals($before, $after, 'Los errores 400 no deben guardarse');
    }

    public function test_middleware_no_captura_401_porque_auth_tiene_prioridad(): void
    {
        // La prioridad de middleware fuerza a auth:sanctum a correr ANTES que ErrorReporting.
        // Por eso los errores 401 no se persisten en error_reporting.
        Route::get('/api/test-401-route', fn () => response()->json('ok'))
            ->middleware(['api', 'auth:sanctum']);

        $before = ErrorReporting::where('status_code', 401)->count();

        $this->getJson('/api/test-401-route') // sin token
            ->assertStatus(401);

        $after = ErrorReporting::where('status_code', 401)->count();
        $this->assertEquals($before, $after, 'Los 401 no se capturan porque auth corre antes que ErrorReporting');
    }
}
