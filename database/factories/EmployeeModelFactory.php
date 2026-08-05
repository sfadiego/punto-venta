<?php

namespace Database\Factories;

use App\Models\EmployeeModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EmployeeModel>
 */
class EmployeeModelFactory extends Factory
{
    protected $model = EmployeeModel::class;

    public function definition(): array
    {
        return [
            EmployeeModel::NAME => $this->faker->name(),
            EmployeeModel::PHONE => $this->faker->numerify('##########'),
            EmployeeModel::SALARY => $this->faker->randomFloat(2, 500, 5000),
            EmployeeModel::SALARY_PERIOD => 'monthly',
            EmployeeModel::WORK_DAYS => ['mon', 'tue', 'wed', 'thu', 'fri'],
            EmployeeModel::ACTIVE => true,
        ];
    }
}
