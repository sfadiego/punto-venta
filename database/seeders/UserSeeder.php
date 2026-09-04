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
        $this->seedUser(config('seed_users.super_admin'), [
            User::NOMBRE => 'Super Admin',
            User::APELLIDO_PATERNO => config('seed_users.super_admin.username'),
            User::APELLIDO_MATERNO => '',
            User::ROL_ID => RoleEnum::SUPERADMIN,
            User::ACTIVO => 1,
            User::TENANT_ID => null,
        ]);

        $this->seedUser(config('seed_users.admin'), [
            User::NOMBRE => 'Admin',
            User::APELLIDO_PATERNO => 'admin',
            User::APELLIDO_MATERNO => '',
            User::ROL_ID => RoleEnum::ADMIN,
            User::ACTIVO => 1,
            User::TENANT_ID => 1,
        ]);

        $this->seedUser(config('seed_users.employe'), [
            User::NOMBRE => 'Empleado',
            User::APELLIDO_PATERNO => 'empleado',
            User::APELLIDO_MATERNO => '',
            User::ROL_ID => RoleEnum::EMPLOYE,
            User::ACTIVO => 1,
            User::TENANT_ID => 1,
        ]);
    }

    /**
     * Empareja por email (el identificador realmente estable de "esta es la cuenta
     * sembrada X") en vez de usuario. usuario también es unique globalmente, y un
     * tenant real cualquiera puede terminar con el mismo username default que este
     * seeder usa (ej. 'admin') — emparejar por ahí encontraba la cuenta equivocada (la
     * de un cliente real) e intentaba pisarle el email, chocando con users_email_unique
     * (bug real visto en producción).
     *
     * Por el mismo motivo, `usuario` solo se asigna al CREAR la cuenta — nunca se
     * reescribe en una ya existente, para no intentar renombrarla a un valor que otro
     * usuario real ya haya tomado (ej. si alguien cambia APP_ADMIN_USER en el dashboard
     * después de que un cliente real ya registró ese mismo username).
     */
    private function seedUser(array $credentials, array $attributes): void
    {
        $email = strtolower(str_replace(' ', '_', $credentials['email']));

        $existing = User::where(User::EMAIL, $email)->first();

        $attributes += [
            'email_verified_at' => now(),
            User::PASSWORD => bcrypt($credentials['password']),
        ];

        if ($existing) {
            $existing->update($attributes);

            return;
        }

        User::create($attributes + [
            User::EMAIL => $email,
            User::USUARIO => $credentials['username'],
        ]);
    }
}
