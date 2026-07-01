<?php

namespace Database\Factories;

use App\Models\BusinessConfigModel;
use Illuminate\Database\Eloquent\Factories\Factory;

class BusinessConfigModelFactory extends Factory
{
    protected $model = BusinessConfigModel::class;

    public function definition(): array
    {
        return [
            BusinessConfigModel::SLUG          => fake()->unique()->slug(2),
            BusinessConfigModel::BUSINESS_NAME => fake()->company(),
            BusinessConfigModel::PRIMARY_COLOR => '#f59e0b',
            BusinessConfigModel::SIDEBAR_COLOR => '#1c1917',
            BusinessConfigModel::FONT_COLOR    => '#ffffff',
            BusinessConfigModel::LABEL_COLOR   => '#1c1917',
            BusinessConfigModel::ACTIVO        => true,
        ];
    }
}
