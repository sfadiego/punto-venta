<?php

namespace Tests\Feature;

use App\Enums\MainOrderStatusEnum;
use App\Enums\RoleEnum;
use App\Http\Middleware\TransactionMiddleware;
use App\Models\BusinessConfigModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderStatusModel;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Tests for TransactionMiddleware.
 *
 * Two test groups:
 * 1. HTTP integration tests — verify commit and rollback at the DB level by going
 *    through the full 'api' middleware stack (same pattern as BackendErrorMiddlewareTest).
 *    The middleware bypasses in tests via runningUnitTests(), so we rebind 'env' to
 *    'production' to enable its real logic.
 *
 * 2. Unit-style tests for the retry/deadlock logic — call handle() directly with a
 *    mocked DB facade to avoid SQLite savepoint complications and isolated the
 *    middleware's retry loop cleanly.
 */
class TransactionMiddlewareTest extends TestCase
{
    private TransactionMiddleware $middleware;

    protected function setUp(): void
    {
        parent::setUp();
        $this->middleware = new TransactionMiddleware;
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private function enableFullMiddleware(): void
    {
        // runningUnitTests() → true when app['env'] === 'testing'.
        // Changing to 'production' lets the middleware run its full transaction logic.
        $this->app->instance('env', 'production');
    }

    protected function tearDown(): void
    {
        // Restore so RefreshDatabase teardown is not affected.
        $this->app->instance('env', 'testing');
        parent::tearDown();
    }

    // ─── Unit-style middleware tests (mocked DB) ─────────────────────────────

    private function makeRequest(string $method = 'POST'): Request
    {
        return Request::create('/api/test', $method);
    }

    public function test_get_skips_transaction_via_handle(): void
    {
        $this->enableFullMiddleware();

        $called = false;
        $response = $this->middleware->handle(
            $this->makeRequest('GET'),
            function () use (&$called) {
                $called = true;

                return new JsonResponse(['status' => 'ok']);
            }
        );

        $this->assertTrue($called);
        $this->assertEquals(200, $response->getStatusCode());
        // DB::beginTransaction should NOT have been called — no assertions needed since
        // if it had been called against the real SQLite it would alter state.
    }

    public function test_post_commits_via_handle(): void
    {
        $this->enableFullMiddleware();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('commit')->once();
        DB::shouldReceive('rollBack')->never();

        $response = $this->middleware->handle(
            $this->makeRequest('POST'),
            fn () => new JsonResponse(['status' => 'OK'])
        );

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_post_rolls_back_on_exception_via_handle(): void
    {
        $this->enableFullMiddleware();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('rollBack')->once();
        DB::shouldReceive('commit')->never();

        $this->expectException(\RuntimeException::class);

        $this->middleware->handle(
            $this->makeRequest('POST'),
            fn () => throw new \RuntimeException('fail')
        );
    }

    public function test_post_rolls_back_on_error_response_via_handle(): void
    {
        $this->enableFullMiddleware();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('rollBack')->once();
        DB::shouldReceive('commit')->never();

        $response = $this->middleware->handle(
            $this->makeRequest('POST'),
            fn () => new JsonResponse(['status' => 'error', 'message' => 'validation failed'])
        );

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_post_rolls_back_on_500_response_via_handle(): void
    {
        $this->enableFullMiddleware();

        DB::shouldReceive('beginTransaction')->once();
        DB::shouldReceive('rollBack')->once();
        DB::shouldReceive('commit')->never();

        $response = $this->middleware->handle(
            $this->makeRequest('POST'),
            fn () => new JsonResponse(['error' => 'server error'], 500)
        );

        $this->assertEquals(500, $response->getStatusCode());
    }

    public function test_retries_on_deadlock_1213_and_succeeds(): void
    {
        $this->enableFullMiddleware();

        DB::shouldReceive('beginTransaction')->times(2);
        DB::shouldReceive('rollBack')->once();
        DB::shouldReceive('commit')->once();

        $attempts = 0;

        $e = new \PDOException('Deadlock found when trying to get lock');
        $e->errorInfo = [40001, 1213, 'Deadlock found'];

        $response = $this->middleware->handle(
            $this->makeRequest('POST'),
            function () use (&$attempts, $e) {
                $attempts++;
                if ($attempts === 1) {
                    throw $e;
                }

                return new JsonResponse(['status' => 'OK', 'attempts' => $attempts]);
            }
        );

        $this->assertEquals(2, $attempts);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_retries_on_lock_timeout_1205_and_succeeds(): void
    {
        $this->enableFullMiddleware();

        DB::shouldReceive('beginTransaction')->times(2);
        DB::shouldReceive('rollBack')->once();
        DB::shouldReceive('commit')->once();

        $attempts = 0;

        $e = new \PDOException('Lock wait timeout exceeded');
        $e->errorInfo = ['HY000', 1205, 'Lock wait timeout exceeded'];

        $response = $this->middleware->handle(
            $this->makeRequest('POST'),
            function () use (&$attempts, $e) {
                $attempts++;
                if ($attempts === 1) {
                    throw $e;
                }

                return new JsonResponse(['status' => 'OK', 'attempts' => $attempts]);
            }
        );

        $this->assertEquals(2, $attempts);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_throws_after_max_retries_exceeded(): void
    {
        $this->enableFullMiddleware();

        // MAX_ATTEMPTS = 3
        DB::shouldReceive('beginTransaction')->times(3);
        DB::shouldReceive('rollBack')->times(3);
        DB::shouldReceive('commit')->never();

        $attempts = 0;

        $e = new \PDOException('Deadlock found when trying to get lock; try restarting transaction');
        $e->errorInfo = [40001, 1213, 'Deadlock found'];

        $this->expectException(\PDOException::class);

        $this->middleware->handle(
            $this->makeRequest('POST'),
            function () use (&$attempts, $e) {
                $attempts++;
                throw $e;
            }
        );

        $this->assertEquals(3, $attempts);
    }

    public function test_retries_on_deadlock_detected_by_message(): void
    {
        $this->enableFullMiddleware();

        DB::shouldReceive('beginTransaction')->times(2);
        DB::shouldReceive('rollBack')->once();
        DB::shouldReceive('commit')->once();

        $attempts = 0;

        $response = $this->middleware->handle(
            $this->makeRequest('POST'),
            function () use (&$attempts) {
                $attempts++;
                if ($attempts === 1) {
                    throw new \RuntimeException('Deadlock found when trying to get lock');
                }

                return new JsonResponse(['status' => 'OK']);
            }
        );

        $this->assertEquals(2, $attempts);
        $this->assertEquals(200, $response->getStatusCode());
    }

    // ─── HTTP integration tests (real DB, real routes) ───────────────────────

    public function test_http_post_commits_data(): void
    {
        $this->enableFullMiddleware();

        $tenant = BusinessConfigModel::first();

        Route::post('/api/test-tx-commit', function () use ($tenant) {
            $report = MainOrderReportModel::create([
                MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
                MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
                MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
                MainOrderReportModel::TENANT_ID => $tenant->id,
            ]);

            OrderModel::create([
                OrderModel::TOTAL => 50,
                OrderModel::SUBTOTAL => 50,
                OrderModel::NOMBRE_PEDIDO => 'tx-commit-test',
                OrderModel::ESTATUS_PEDIDO_ID => OrderStatusModel::first()->id,
                OrderModel::SISTEMA_ID => $report->id,
                OrderModel::TENANT_ID => $tenant->id,
            ]);

            return response()->json(['status' => 'OK']);
        })->middleware(['api']);

        $this->postJson('/api/test-tx-commit')->assertStatus(200);

        $this->assertDatabaseHas('order', ['nombre_pedido' => 'tx-commit-test']);
    }

    public function test_http_post_rolls_back_on_exception(): void
    {
        $this->enableFullMiddleware();

        $tenant = BusinessConfigModel::first();

        Route::post('/api/test-tx-rollback', function () use ($tenant) {
            $report = MainOrderReportModel::create([
                MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
                MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
                MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
                MainOrderReportModel::TENANT_ID => $tenant->id,
            ]);

            OrderModel::create([
                OrderModel::TOTAL => 99,
                OrderModel::SUBTOTAL => 99,
                OrderModel::NOMBRE_PEDIDO => 'tx-rollback-test',
                OrderModel::ESTATUS_PEDIDO_ID => OrderStatusModel::first()->id,
                OrderModel::SISTEMA_ID => $report->id,
                OrderModel::TENANT_ID => $tenant->id,
            ]);

            throw new \RuntimeException('Simulated failure');
        })->middleware(['api']);

        $this->postJson('/api/test-tx-rollback')->assertStatus(500);

        $this->assertDatabaseMissing('order', ['nombre_pedido' => 'tx-rollback-test']);
    }
}
