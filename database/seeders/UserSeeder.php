<?php

namespace Database\Seeders;

use App\Enums\RoleEnum;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate([
            User::USUARIO => env('APP_SUPER_ADMIN_USER'),
        ], [
            User::NOMBRE => 'Super Admin',
            User::EMAIL => strtolower(str_replace(' ', '_', env('APP_SUPER_ADMIN_EMAIL'))),
            'email_verified_at' => now(),
            User::USUARIO => env('APP_SUPER_ADMIN_USER'),
            User::PASSWORD => bcrypt(env('APP_SUPER_ADMIN_PASSWORD')),
            User::APELLIDO_PATERNO => env('APP_SUPER_ADMIN_USER'),
            User::APELLIDO_MATERNO => '',
            User::ROL_ID => RoleEnum::SUPERADMIN,
            User::ACTIVO => 1,
            User::TENANT_ID => null,
        ]);

        User::updateOrCreate([
            User::USUARIO => env('APP_ADMIN_USER'),
        ], [
            User::NOMBRE => 'Admin',
            User::EMAIL => strtolower(str_replace(' ', '_', env('APP_ADMIN_EMAIL'))),
            'email_verified_at' => now(),
            User::USUARIO => env('APP_ADMIN_USER'),
            User::PASSWORD => bcrypt(env('APP_ADMIN_PASSWORD')),
            User::APELLIDO_PATERNO => 'admin',
            User::APELLIDO_MATERNO => '',
            User::ROL_ID => RoleEnum::ADMIN,
            User::ACTIVO => 1,
            User::TENANT_ID => 1,
        ]);
        User::updateOrCreate([
            User::USUARIO => env('APP_USER_USER'),
        ], [
            User::NOMBRE => 'Empleado',
            User::APELLIDO_PATERNO => 'empleado',
            User::APELLIDO_MATERNO => '',
            User::EMAIL => strtolower(str_replace(' ', '_', env('APP_USER_EMAIL'))),
            'email_verified_at' => now(),
            User::USUARIO => env('APP_USER_USER'),
            User::PASSWORD => bcrypt(env('APP_USER_PASSWORD')),
            User::ROL_ID => RoleEnum::EMPLOYE,
            User::ACTIVO => 1,
            User::TENANT_ID => 1,
        ]);
    }
}
