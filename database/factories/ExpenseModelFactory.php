<?php

namespace Database\Factories;

use App\Enums\RoleEnum;
use App\Models\ExpenseModel;
use App\Models\MainOrderReportModel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ExpenseModel>
 */
class ExpenseModelFactory extends Factory
{
    protected $model = ExpenseModel::class;

    public function definition(): array
    {
        return [
            ExpenseModel::SISTEMA_ID => MainOrderReportModel::factory(),
            ExpenseModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN)->get()->random()->id,
            ExpenseModel::CONCEPTO => fake()->randomElement([
                'Compra de servilletas', 'Hielo', 'Gas para cocina', 'Reparación de equipo',
            ]),
            ExpenseModel::MONTO => fake()->randomFloat(2, 20, 500),
            ExpenseModel::OBSERVACIONES => null,
        ];
    }
}
