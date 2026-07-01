<?php

namespace Database\Factories;

use App\Enums\SubscriptionPlanEnum;
use App\Models\BusinessConfigModel;
use App\Models\SubscriptionModel;
use Illuminate\Database\Eloquent\Factories\Factory;

class SubscriptionModelFactory extends Factory
{
    protected $model = SubscriptionModel::class;

    public function definition(): array
    {
        return [
            SubscriptionModel::TENANT_ID  => BusinessConfigModel::factory(),
            SubscriptionModel::PLAN       => SubscriptionPlanEnum::Lifetime->value,
            SubscriptionModel::STARTS_AT  => now(),
            SubscriptionModel::EXPIRES_AT => '2099-12-31',
            SubscriptionModel::PAID_AT    => now(),
            SubscriptionModel::AMOUNT     => 0,
        ];
    }
}
