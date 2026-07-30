<?php

namespace Tests\Security;

use App\Enums\RoleEnum;
use App\Models\User;
use Tests\TestCase;

class AdminOnlyRoutesTest extends TestCase
{
    private function empleado(): User
    {
        return User::where('rol_id', RoleEnum::EMPLOYE->value)->first();
    }

    public function test_empleado_no_puede_autopromoverse_a_admin(): void
    {
        $empleado = $this->empleado();

        $this->putJson("/api/admin/users/{$empleado->id}", [
            'nombre' => $empleado->nombre,
            'apellido_paterno' => $empleado->apellido_paterno ?? 'Paterno',
            'email' => $empleado->email,
            'usuario' => $empleado->usuario,
            'rol_id' => RoleEnum::ADMIN->value,
            'activo' => true,
        ], $this->authHeaders($empleado))
            ->assertStatus(403);

        $this->assertDatabaseHas('users', [
            'id' => $empleado->id,
            'rol_id' => RoleEnum::EMPLOYE->value,
        ]);
    }

    public function test_empleado_no_lista_usuarios(): void
    {
        $this->getJson('/api/admin/users', $this->authHeaders($this->empleado()))
            ->assertStatus(403);
    }

    public function test_empleado_no_puede_editar_role_permissions(): void
    {
        $this->putJson('/api/admin/role-permissions/'.RoleEnum::EMPLOYE->value, [
            'permissions' => ['manageProducts', 'viewDashboard'],
        ], $this->authHeaders($this->empleado()))
            ->assertStatus(403);
    }

    public function test_empleado_no_lee_role_permissions(): void
    {
        $this->getJson('/api/admin/role-permissions', $this->authHeaders($this->empleado()))
            ->assertStatus(403);
    }

    public function test_empleado_no_puede_editar_config_del_negocio(): void
    {
        $this->putJson('/api/admin/config', [
            'business_name' => 'Negocio Hackeado',
        ], $this->authHeaders($this->empleado()))
            ->assertStatus(403);
    }

    public function test_empleado_no_lee_config_del_negocio(): void
    {
        $this->getJson('/api/admin/config', $this->authHeaders($this->empleado()))
            ->assertStatus(403);
    }

    public function test_empleado_no_administra_metodos_de_pago(): void
    {
        $this->getJson('/api/admin/payment-methods', $this->authHeaders($this->empleado()))
            ->assertStatus(403);

        $this->postJson('/api/admin/payment-methods', [
            'nombre' => 'Nuevo metodo',
        ], $this->authHeaders($this->empleado()))
            ->assertStatus(403);
    }

    public function test_empleado_no_ve_estadisticas(): void
    {
        $this->getJson('/api/admin/system/statistics/best-seller', $this->authHeaders($this->empleado()))
            ->assertStatus(403);
    }

    public function test_empleado_si_puede_ver_estado_de_suscripcion(): void
    {
        // Este endpoint alimenta el banner de suscripción visible en el Dashboard
        // para todos los roles — no debe quedar detrás del gate de admin.
        $this->getJson('/api/admin/config/subscription-status', $this->authHeaders($this->empleado()))
            ->assertStatus(200);
    }

    public function test_admin_si_accede_a_rutas_admin(): void
    {
        $this->getJson('/api/admin/users', $this->authHeaders())
            ->assertStatus(206);

        $this->getJson('/api/admin/role-permissions', $this->authHeaders())
            ->assertStatus(200);

        $this->getJson('/api/admin/config', $this->authHeaders())
            ->assertStatus(200);
    }
}
