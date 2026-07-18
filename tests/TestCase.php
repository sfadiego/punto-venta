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

        // Fuerza SQLite en memoria después de que .env carga pero antes de que
        // RefreshDatabase corra las migraciones. Esto evita que los tests toquen
        // la base de datos MySQL de desarrollo/producción sin importar la configuración.
        config([
            'database.default'                       => 'sqlite',
            'database.connections.sqlite.database'   => ':memory:',
        ]);
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

    protected function authHeaders(?User $user = null): array
    {
        $user ??= User::where('rol_id', RoleEnum::ADMIN->value)->first();
        $token = $user->createToken('test')->plainTextToken;

        return ['Authorization' => "Bearer $token"];
    }
}
