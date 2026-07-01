<?php

namespace Database\Factories;

use App\Models\CategoryModel;
use App\Models\ProductModel as Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Model>
 */
class ProductModelFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            Product::NOMBRE => $this->faker->word(),
            Product::PRECIO => $this->faker->numberBetween(40, 60),
            Product::DESCRIPCION => $this->faker->paragraph(),
            Product::CATEGORIA_ID => CategoryModel::all()->random()->id,
            Product::ACTIVO => true,
            Product::FOTO_ID => null,
        ];
    }
}
