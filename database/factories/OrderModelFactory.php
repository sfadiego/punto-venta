<?php

namespace Database\Factories;

use App\Enums\OrderStatusEnum;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\OrderModel>
 */
class OrderModelFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    protected $model = OrderModel::class;

    public function definition(): array
    {
        $total = $this->faker->numberBetween(1, 500);

        return [
            OrderModel::TOTAL => $total,
            OrderModel::SUBTOTAL => $total,
            OrderModel::DESCUENTO => $this->faker->numberBetween(1, 99),
            OrderModel::NOMBRE_PEDIDO => $this->faker->name(),
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::IN_PROCESS,
            OrderModel::SISTEMA_ID => MainOrderReportModel::all()->random()->id,
        ];
    }
}
