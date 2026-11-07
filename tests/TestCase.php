<?php

namespace Tests;

use App\Enums\RoleEnum;
use App\Enums\SubscriptionPlanEnum;
use App\Models\BusinessConfigModel;
use App\Models\SubscriptionModel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected bool $seed = true;

    protected function refreshApplication(): void
    {
        parent::refreshApplication();

        // Antes de que RefreshDatabase corra las migraciones se fuerza SQLite en memoria, salvo que se
        // pida MySQL local de forma explícita (ver usesLocalMysqlTestingDatabase). Esto evita que los
        // tests toquen la base de datos MySQL de desarrollo/producción sin importar la configuración.
        if (! $this->usesLocalMysqlTestingDatabase()) {
            config([
                'database.default' => 'sqlite',
                'database.connections.sqlite.database' => ':memory:',
            ]);
        }
    }

    /**
     * MySQL solo se acepta si es la conexión por defecto, la base termina en "_testing" (nunca la de
     * desarrollo/producción) y el host es local. RefreshDatabase borra y recrea todas sus tablas.
     * El pipeline de GitHub fija SQLite, así que nunca cumple esto.
     */
    private function usesLocalMysqlTestingDatabase(): bool
    {
        $mysql = config('database.connections.mysql');

        return config('database.default') === 'mysql'
            && str_ends_with((string) $mysql['database'], '_testing')
            && in_array($mysql['host'], ['localhost', '127.0.0.1'], true);
    }

    protected function setUp(): void
    {
        parent::setUp();

        $tenant = BusinessConfigModel::first();

        if ($tenant) {
            $tenant->update([
                BusinessConfigModel::SUBSCRIPTION_PLAN => SubscriptionPlanEnum::Lifetime->value,
            ]);
        }

        if (! SubscriptionModel::exists()) {
            SubscriptionModel::create([
                SubscriptionModel::TENANT_ID => $tenant?->id ?? BusinessConfigModel::first()->id,
                SubscriptionModel::PLAN => SubscriptionPlanEnum::Lifetime->value,
                SubscriptionModel::STARTS_AT => now(),
                SubscriptionModel::EXPIRES_AT => now()->addYears(50),
                SubscriptionModel::PAID_AT => now(),
                SubscriptionModel::AMOUNT => 0,
            ]);
        }
    }

    /**
     * El guard de Sanctum cachea el usuario resuelto en la primera llamada y lo reutiliza en
     * requests posteriores dentro del mismo test (Illuminate\Auth\RequestGuard::$user), sin
     * importar el bearer token que se envíe después — un problema real solo en tests que hacen
     * más de una request autenticada como usuarios distintos dentro del mismo método. Se limpia
     * aquí para que authHeaders() sea seguro de usar así, sin que cada test tenga que saberlo.
     */
    protected function authHeaders(?User $user = null): array
    {
        $this->app['auth']->forgetGuards();

        $user ??= User::where('rol_id', RoleEnum::ADMIN->value)->first();
        $token = $user->createToken('test')->plainTextToken;

        return ['Authorization' => "Bearer $token"];
    }
}
