<?php

namespace Tests\Security;

use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\CustomerModel;
use App\Models\Permission;
use App\Models\RolePermission;
use App\Models\User;
use Tests\TestCase;

class AdminOnlyRoutesTest extends TestCase
{
    private function empleado(): User
    {
        return User::where('rol_id', RoleEnum::EMPLOYE->value)->first();
    }

    private function otorgarPermiso(int $roleId, string $key): void
    {
        $permission = Permission::where(Permission::KEY, $key)->firstOrFail();

        RolePermission::create([
            RolePermission::TENANT_ID => BusinessConfigModel::first()->id,
            RolePermission::ROLE_ID => $roleId,
            RolePermission::PERMISSION_ID => $permission->id,
        ]);
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

    public function test_empleado_con_permiso_viewusers_si_lista_usuarios(): void
    {
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewUsers');

        $this->getJson('/api/admin/users', $this->authHeaders($this->empleado()))
            ->assertStatus(206);
    }

    public function test_empleado_con_permiso_viewusers_no_puede_crear_ni_editar_usuarios(): void
    {
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewUsers');
        $empleado = $this->empleado();

        // "viewUsers" solo da lectura — crear/editar sigue siendo exclusivo de Admin.
        $this->postJson('/api/admin/users', [
            'nombre' => 'Intruso', 'apellido_paterno' => 'Test',
            'email' => 'intruso-'.uniqid().'@test.com', 'usuario' => 'intruso-'.uniqid(),
            'password' => 'Password123', 'rol_id' => RoleEnum::EMPLOYE->value,
        ], $this->authHeaders($empleado))
            ->assertStatus(403);

        $this->putJson("/api/admin/users/{$empleado->id}", [
            'nombre' => 'Hackeado', 'apellido_paterno' => $empleado->apellido_paterno ?? 'Paterno',
            'email' => $empleado->email, 'usuario' => $empleado->usuario,
            'rol_id' => RoleEnum::EMPLOYE->value, 'activo' => true,
        ], $this->authHeaders($empleado))
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

    public function test_empleado_con_permiso_viewadmin_si_lee_role_permissions(): void
    {
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewAdmin');

        $this->getJson('/api/admin/role-permissions', $this->authHeaders($this->empleado()))
            ->assertStatus(200);
    }

    public function test_empleado_con_permiso_viewadmin_no_puede_editar_role_permissions(): void
    {
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewAdmin');

        $this->putJson('/api/admin/role-permissions/'.RoleEnum::EMPLOYE->value, [
            'permissions' => ['viewDashboard', 'viewAdmin'],
        ], $this->authHeaders($this->empleado()))
            ->assertStatus(403);
    }

    public function test_empleado_no_puede_editar_config_del_negocio(): void
    {
        $this->putJson('/api/admin/config', [
            'business_name' => 'Negocio Hackeado',
        ], $this->authHeaders($this->empleado()))
            ->assertStatus(403);
    }

    public function test_empleado_si_lee_config_del_negocio(): void
    {
        // Colores/branding se usan en toda la app (sidebar, layout) para cualquier rol —
        // no debe quedar detrás del gate de admin. Solo la escritura es admin-only.
        $this->getJson('/api/admin/config', $this->authHeaders($this->empleado()))
            ->assertStatus(200);
    }

    public function test_empleado_no_administra_metodos_de_pago(): void
    {
        // La lectura sí es necesaria (checkout de cualquier rol con permiso payOrder);
        // solo la escritura (crear/editar/borrar métodos) es admin-only.
        $this->getJson('/api/admin/payment-methods', $this->authHeaders($this->empleado()))
            ->assertStatus(200);

        $this->postJson('/api/admin/payment-methods', [
            'nombre' => 'Nuevo metodo',
        ], $this->authHeaders($this->empleado()))
            ->assertStatus(403);
    }

    public function test_empleado_si_ve_estadisticas_de_mas_vendido(): void
    {
        // useDashboard.ts lo consume para todos los roles, no solo desde la página
        // de Estadísticas (esa sí sigue siendo Admin-only vía el router del frontend).
        $this->getJson('/api/admin/system/statistics/best-seller', $this->authHeaders($this->empleado()))
            ->assertStatus(200);
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

    public function test_admin_no_puede_autopromoverse_a_superadmin(): void
    {
        $admin = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->putJson("/api/admin/users/{$admin->id}", [
            'nombre' => $admin->nombre,
            'apellido_paterno' => $admin->apellido_paterno ?? 'Paterno',
            'email' => $admin->email,
            'usuario' => $admin->usuario,
            'rol_id' => RoleEnum::SUPERADMIN->value,
            'activo' => true,
        ], $this->authHeaders($admin))
            ->assertStatus(400);

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'rol_id' => RoleEnum::ADMIN->value,
        ]);
    }

    public function test_empleado_no_puede_crear_editar_ni_borrar_categorias(): void
    {
        $empleado = $this->empleado();

        $this->postJson('/api/category', [
            'nombre' => 'Categoria Intrusa',
        ], $this->authHeaders($empleado))
            ->assertStatus(403);

        $category = CategoryModel::first();

        $this->putJson("/api/category/{$category->id}", [
            'nombre' => 'Renombrada',
        ], $this->authHeaders($empleado))
            ->assertStatus(403);

        $this->deleteJson("/api/category/{$category->id}", [], $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    public function test_empleado_si_puede_listar_y_ver_categorias(): void
    {
        $empleado = $this->empleado();

        $this->getJson('/api/category', $this->authHeaders($empleado))
            ->assertStatus(206);

        $category = CategoryModel::first();

        $this->getJson("/api/category/{$category->id}", $this->authHeaders($empleado))
            ->assertStatus(200);
    }

    private function crearCliente(): CustomerModel
    {
        return CustomerModel::create([
            CustomerModel::NAME => 'Cliente Test '.uniqid(),
            CustomerModel::PHONE => '5512345678',
            CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    public function test_empleado_si_puede_crear_cliente_inline(): void
    {
        // Necesario para la alta inline de cliente en el picker de venta a crédito
        // (SellByWeightSaleModal), accesible a todos los roles desde el Dashboard.
        $this->postJson('/api/customer', [
            'name' => 'Cliente Inline',
            'phone' => '5512345678',
        ], $this->authHeaders($this->empleado()))
            ->assertStatus(200);
    }

    public function test_empleado_no_puede_editar_borrar_ni_fiar_clientes(): void
    {
        $empleado = $this->empleado();
        $customer = $this->crearCliente();

        $this->putJson("/api/customer/{$customer->id}", [
            'name' => 'Renombrado',
        ], $this->authHeaders($empleado))
            ->assertStatus(403);

        $this->patchJson("/api/customer/{$customer->id}/toggle-credit", [], $this->authHeaders($empleado))
            ->assertStatus(403);

        $this->postJson("/api/customer/{$customer->id}/payment", [
            'amount' => 10,
        ], $this->authHeaders($empleado))
            ->assertStatus(403);

        $this->deleteJson("/api/customer/{$customer->id}", [], $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    public function test_empleado_si_puede_listar_y_ver_clientes(): void
    {
        $empleado = $this->empleado();
        $customer = $this->crearCliente();

        $this->getJson('/api/customer', $this->authHeaders($empleado))
            ->assertStatus(206);

        $this->getJson("/api/customer/{$customer->id}", $this->authHeaders($empleado))
            ->assertStatus(200);
    }
}
