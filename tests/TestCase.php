<?php

namespace Tests;

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

    protected function setUp(): void
    {
        parent::setUp();

        if (! SubscriptionModel::exists()) {
            SubscriptionModel::create([
                SubscriptionModel::TENANT_ID => BusinessConfigModel::first()->id,
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
        $user ??= User::where('rol_id', 1)->first();
        $token = $user->createToken('test')->plainTextToken;

        return ['Authorization' => "Bearer $token"];
    }
}
