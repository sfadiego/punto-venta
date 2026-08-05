<?php

namespace Database\Factories;

use App\Models\ProviderModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProviderModel>
 */
class ProviderModelFactory extends Factory
{
    protected $model = ProviderModel::class;

    public function definition(): array
    {
        return [
            ProviderModel::NAME => $this->faker->company(),
            ProviderModel::PHONE => $this->faker->numerify('##########'),
            ProviderModel::CONTACT_NAME => $this->faker->name(),
            ProviderModel::NOTES => null,
        ];
    }
}
