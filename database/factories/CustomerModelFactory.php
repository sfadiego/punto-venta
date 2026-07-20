<?php

namespace Database\Factories;

use App\Models\CustomerModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CustomerModel>
 */
class CustomerModelFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    protected $model = CustomerModel::class;

    public function definition(): array
    {
        return [
            CustomerModel::NAME => $this->faker->company(),
            CustomerModel::PHONE => $this->faker->numerify('##########'),
            CustomerModel::NOTES => null,
            CustomerModel::ALLOW_CREDIT => true,
            CustomerModel::BALANCE => 0,
        ];
    }
}
