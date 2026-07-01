<?php

namespace Database\Factories;

use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\ProductModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\orderProductModel>
 */
class OrderProductModelFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    protected $model = OrderProductModel::class;

    public function definition(): array
    {
        return [
            OrderProductModel::PRODUCTO_ID => ProductModel::all()->random()->id,
            OrderProductModel::PEDIDO_ID => OrderModel::all()->random()->id,
            OrderProductModel::DESCUENTO => $this->faker->numberBetween(1, 9),
            OrderProductModel::CANTIDAD => $this->faker->numberBetween(1, 10),
            OrderProductModel::PRECIO => $this->faker->numberBetween(60, 100),
        ];
    }
}
