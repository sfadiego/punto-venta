<?php

namespace Database\Factories;

use App\Enums\RoleEnum;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            User::NOMBRE => fake()->firstName(),
            User::EMAIL => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            User::USUARIO => fake()->unique()->userName(),
            User::PASSWORD => bcrypt('password'),
            User::APELLIDO_PATERNO => fake()->lastName(),
            User::APELLIDO_MATERNO => fake()->lastName(),
            User::ROL_ID => RoleEnum::EMPLOYE->value,
            User::ACTIVO => 1,
        ];
    }

    public function admin(): static
    {
        return $this->state(['rol_id' => RoleEnum::ADMIN->value]);
    }
}
