<?php

namespace Database\Factories;

use App\Models\ProviderModel;
use App\Models\ProviderPurchaseModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProviderPurchaseModel>
 */
class ProviderPurchaseModelFactory extends Factory
{
    protected $model = ProviderPurchaseModel::class;

    public function definition(): array
    {
        return [
            ProviderPurchaseModel::PROVIDER_ID => ProviderModel::factory(),
            ProviderPurchaseModel::AMOUNT => $this->faker->randomFloat(2, 100, 5000),
            ProviderPurchaseModel::IS_CREDIT => false,
            ProviderPurchaseModel::CREATED_BY => null,
            ProviderPurchaseModel::NOTE => $this->faker->sentence(),
        ];
    }
}
