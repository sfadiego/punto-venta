<?php

namespace Database\Seeders;

use App\Enums\SubscriptionPlanEnum;
use App\Models\BusinessConfigModel;
use App\Models\SubscriptionModel;
use Illuminate\Database\Seeder;

class SubscriptionSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = BusinessConfigModel::first();

        if (! $tenant) {
            return;
        }

        SubscriptionModel::firstOrCreate(
            [SubscriptionModel::TENANT_ID => $tenant->id],
            [
                SubscriptionModel::PLAN => SubscriptionPlanEnum::Lifetime->value,
                SubscriptionModel::STARTS_AT => now(),
                SubscriptionModel::EXPIRES_AT => '2099-12-31',
                SubscriptionModel::PAID_AT => now(),
                SubscriptionModel::AMOUNT => 0,
            ]
        );
    }
}
