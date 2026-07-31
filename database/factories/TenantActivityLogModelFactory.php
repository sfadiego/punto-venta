<?php

namespace Database\Factories;

use App\Enums\ActivityTypeEnum;
use App\Models\BusinessConfigModel;
use App\Models\TenantActivityLogModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TenantActivityLogModel>
 */
class TenantActivityLogModelFactory extends Factory
{
    protected $model = TenantActivityLogModel::class;

    public function definition(): array
    {
        return [
            TenantActivityLogModel::TENANT_ID => BusinessConfigModel::query()->value('id'),
            TenantActivityLogModel::TYPE => fake()->randomElement(ActivityTypeEnum::cases())->value,
            TenantActivityLogModel::CREATED_AT => now(),
        ];
    }
}
