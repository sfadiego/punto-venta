<?php

namespace Database\Factories;

use App\Models\BranchModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BranchModel>
 */
class BranchModelFactory extends Factory
{
    protected $model = BranchModel::class;

    public function definition(): array
    {
        return [
            BranchModel::NAME => $this->faker->company(),
            BranchModel::ADDRESS => $this->faker->address(),
            BranchModel::PHONE => $this->faker->numerify('##########'),
            BranchModel::ACTIVE => true,
        ];
    }
}
