<?php

namespace Database\Factories;

use App\Models\AddonModel;
use App\Models\BusinessConfigModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AddonModel>
 */
class AddonModelFactory extends Factory
{
    protected $model = AddonModel::class;

    public function definition(): array
    {
        return [
            AddonModel::NAME => $this->faker->unique()->randomElement(['Nieve', 'Chocolate', 'Leche Nestlé', 'Fresas', 'Plátano', 'Crema batida', 'Nutella']),
            AddonModel::PRICE => $this->faker->randomElement([0, 10, 15, 20]),
            AddonModel::IS_ACTIVE => true,
            // Fuera de una request HTTP (tests, seeders) no hay tenant_id bindeado en el contenedor.
            AddonModel::TENANT_ID => app()->bound('tenant_id') ? app('tenant_id') : BusinessConfigModel::first()->id,
        ];
    }
}
