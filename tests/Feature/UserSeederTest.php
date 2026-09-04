<?php

namespace Tests\Feature;

use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\User;
use Database\Seeders\UserSeeder;
use Tests\TestCase;

/**
 * Cubre un bug real de producción: UserSeeder emparejaba por `usuario` (también unique
 * globalmente), y un cliente real distinto ("Verduleria") ya tenía usuario='admin' con
 * su propio email — el seeder encontraba esa fila ajena e intentaba pisarle el email al
 * valor del admin sembrado, chocando con users_email_unique. Debe emparejar por email y
 * nunca reescribir `usuario` en una cuenta ya existente.
 */
class UserSeederTest extends TestCase
{
    public function test_no_falla_si_otro_cliente_real_ya_tiene_el_username_default(): void
    {
        $adminUsername = config('seed_users.admin.username');
        $adminEmail = strtolower(str_replace(' ', '_', config('seed_users.admin.email')));

        // El admin sembrado ya existe (de un deploy anterior) con un usuario legacy
        // distinto al default actual — simula que APP_ADMIN_USER cambió en algún punto.
        User::where(User::EMAIL, $adminEmail)->update([User::USUARIO => 'legacy-admin']);

        // Un cliente real distinto ya es dueño del username default ('admin').
        $verduleria = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'verduleria-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Verduleria',
            BusinessConfigModel::PRIMARY_COLOR => '#22c55e',
            BusinessConfigModel::SIDEBAR_COLOR => '#14532d',
            BusinessConfigModel::FONT_COLOR => '#ffffff',
            BusinessConfigModel::LABEL_COLOR => '#14532d',
            BusinessConfigModel::SUBSCRIPTION_PLAN => 'lifetime',
        ]);
        User::factory()->create([
            User::USUARIO => $adminUsername,
            User::EMAIL => 'admin@verduleria.com',
            User::ROL_ID => RoleEnum::ADMIN->value,
            User::TENANT_ID => $verduleria->id,
        ]);

        (new UserSeeder)->run();

        // El admin sembrado se actualiza por email, pero conserva su usuario legacy —
        // el seeder no debe intentar renombrarlo a 'admin' (ya tomado por Verduleria).
        $this->assertDatabaseHas('users', [
            'email' => $adminEmail,
            'usuario' => 'legacy-admin',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'admin@verduleria.com',
            'usuario' => $adminUsername,
            'tenant_id' => $verduleria->id,
        ]);
    }

    public function test_es_idempotente_si_ya_existe(): void
    {
        $countAntes = User::count();

        (new UserSeeder)->run();
        (new UserSeeder)->run();

        $this->assertEquals($countAntes, User::count());
    }

    public function test_crea_las_3_cuentas_con_su_usuario_default_en_una_instalacion_nueva(): void
    {
        User::query()->delete();

        (new UserSeeder)->run();

        $this->assertDatabaseHas('users', [
            'email' => strtolower(str_replace(' ', '_', config('seed_users.super_admin.email'))),
            'usuario' => config('seed_users.super_admin.username'),
        ]);
        $this->assertDatabaseHas('users', [
            'email' => strtolower(str_replace(' ', '_', config('seed_users.admin.email'))),
            'usuario' => config('seed_users.admin.username'),
        ]);
        $this->assertDatabaseHas('users', [
            'email' => strtolower(str_replace(' ', '_', config('seed_users.employe.email'))),
            'usuario' => config('seed_users.employe.username'),
        ]);
    }
}
