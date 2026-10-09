<?php

namespace Database\Factories;

use App\Enums\LayawayPaymentTypeEnum;
use App\Models\OrderLayawayPaymentModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\OrderLayawayPaymentModel>
 */
class OrderLayawayPaymentModelFactory extends Factory
{
    protected $model = OrderLayawayPaymentModel::class;

    public function definition(): array
    {
        return [
            OrderLayawayPaymentModel::TYPE => LayawayPaymentTypeEnum::Deposit,
            OrderLayawayPaymentModel::AMOUNT => $this->faker->numberBetween(50, 300),
        ];
    }
}
