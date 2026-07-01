<?php

namespace Database\Factories;

use App\Models\CategoryModel;
use Illuminate\Database\Eloquent\Factories\Factory;

class CategoryModelFactory extends Factory
{
    protected $model = CategoryModel::class;

    public function definition(): array
    {
        return [
            CategoryModel::NOMBRE => fake()->unique()->words(2, true),
            CategoryModel::ORDEN => fake()->numberBetween(1, 50),
            CategoryModel::ICON_NAME => fake()->randomElement(['Coffee', 'Pizza', 'Star', 'Package', 'ShoppingCart']),
        ];
    }
}
