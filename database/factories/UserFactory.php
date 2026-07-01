<?php

namespace Database\Factories;

use App\Models\RoleModel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    protected $model = User::class;

    public function definition(): array
    {
        return [
            User::NOMBRE => fake()->name(),
            User::EMAIL => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            User::USUARIO => fake()->unique()->userName,
            User::PASSWORD => bcrypt('chantico'),
            User::APELLIDO_MATERNO => fake()->name(),
            User::APELLIDO_PATERNO => fake()->name(),
            User::ROL_ID => RoleModel::all()->random()->id,
            User::ACTIVO => 1,
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
