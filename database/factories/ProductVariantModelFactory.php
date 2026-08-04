<?php

namespace Database\Factories;

use App\Models\ProductModel;
use App\Models\ProductVariantModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductVariantModel>
 */
class ProductVariantModelFactory extends Factory
{
    protected $model = ProductVariantModel::class;

    public function definition(): array
    {
        return [
            ProductVariantModel::PRODUCT_ID => ProductModel::all()->random()->id,
            ProductVariantModel::NOMBRE => $this->faker->randomElement(['Chica', 'Mediana', 'Grande', 'Familiar']),
            ProductVariantModel::PRECIO => $this->faker->numberBetween(40, 200),
            ProductVariantModel::ORDEN => 0,
            ProductVariantModel::ACTIVO => true,
        ];
    }
}
