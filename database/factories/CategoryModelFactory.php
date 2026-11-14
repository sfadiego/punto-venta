<?php

namespace Database\Factories;

use App\Models\CategoryModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CategoryModel>
 */
class CategoryModelFactory extends Factory
{
    protected $model = CategoryModel::class;

    public function definition(): array
    {
        return [
            CategoryModel::NOMBRE => fake()->unique()->words(2, true),
            CategoryModel::ORDEN => fake()->numberBetween(1, 99),
            CategoryModel::ICON_NAME => 'Tag',
        ];
    }
}
