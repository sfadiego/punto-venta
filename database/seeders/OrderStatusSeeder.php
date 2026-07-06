<?php

namespace Database\Seeders;

use App\Enums\OrderStatusEnum;
use App\Models\OrderStatusModel;
use Illuminate\Database\Seeder;

class OrderStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            ['id' => OrderStatusEnum::IN_PROCESS->value,    OrderStatusModel::NOMBRE => OrderStatusEnum::orderStatusName(OrderStatusEnum::IN_PROCESS)],
            ['id' => OrderStatusEnum::CANCELED->value,      OrderStatusModel::NOMBRE => OrderStatusEnum::orderStatusName(OrderStatusEnum::CANCELED)],
            ['id' => OrderStatusEnum::CLOSED->value,        OrderStatusModel::NOMBRE => OrderStatusEnum::orderStatusName(OrderStatusEnum::CLOSED)],
            ['id' => OrderStatusEnum::DELETED->value,       OrderStatusModel::NOMBRE => OrderStatusEnum::orderStatusName(OrderStatusEnum::DELETED)],
            ['id' => OrderStatusEnum::SERVED->value,        OrderStatusModel::NOMBRE => OrderStatusEnum::orderStatusName(OrderStatusEnum::SERVED)],
        ];

        OrderStatusModel::insertOrIgnore($data);
    }
}
