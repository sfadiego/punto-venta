<?php

namespace Tests\Employees;

use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\EmployeeModel;
use App\Models\User;
use Tests\TestCase;

class EmployeeTest extends TestCase
{
    private function crearEmpleado(array $overrides = []): EmployeeModel
    {
        return EmployeeModel::create(array_merge([
            EmployeeModel::NAME => 'Empleado Test '.uniqid(),
            EmployeeModel::PHONE => '5512345678',
            EmployeeModel::SALARY => 1500,
            EmployeeModel::SALARY_PERIOD => 'weekly',
            EmployeeModel::WORK_DAYS => ['mon', 'tue', 'wed', 'thu', 'fri'],
            EmployeeModel::TENANT_ID => BusinessConfigModel::first()->id,
        ], $overrides));
    }

    // ── Index ────────────────────────────────────────────────

    public function test_lista_empleados_paginada(): void
    {
        $this->crearEmpleado();

        $this->getJson('/api/employee?page=1&limit=5', $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonStructure(['current_page', 'data', 'total', 'per_page']);
    }

    public function test_busca_empleado_por_nombre(): void
    {
        $employee = $this->crearEmpleado(['name' => 'Juan Pérez']);
        $this->crearEmpleado(['name' => 'Otro Empleado']);

        $response = $this->getJson('/api/employee?search=Juan Pérez', $this->authHeaders())
            ->assertStatus(206);

        $names = array_column($response->json('data'), 'name');
        $this->assertContains($employee->name, $names);
        $this->assertNotContains('Otro Empleado', $names);
    }

    public function test_lista_empleados_simple(): void
    {
        $this->crearEmpleado();

        $response = $this->getJson('/api/employee/list', $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure(['status', 'data' => [['id', 'name', 'phone']]]);
    }

    public function test_filtra_listado_paginado_por_activos(): void
    {
        $activo = $this->crearEmpleado(['name' => 'Empleado Activo']);
        $this->crearEmpleado(['name' => 'Empleado Oculto', 'active' => false]);

        $response = $this->getJson('/api/employee?limit=50&active=true', $this->authHeaders())
            ->assertStatus(206);

        $names = array_column($response->json('data'), 'name');
        $this->assertContains($activo->name, $names);
        $this->assertNotContains('Empleado Oculto', $names);
    }

    public function test_lista_empleados_simple_no_incluye_inactivos(): void
    {
        $activo = $this->crearEmpleado(['name' => 'Empleado Activo']);
        $this->crearEmpleado(['name' => 'Empleado Oculto', 'active' => false]);

        $response = $this->getJson('/api/employee/list', $this->authHeaders())
            ->assertStatus(200);

        $names = array_column($response->json('data'), 'name');
        $this->assertContains($activo->name, $names);
        $this->assertNotContains('Empleado Oculto', $names);
    }

    // ── Store ────────────────────────────────────────────────

    public function test_crea_empleado(): void
    {
        $response = $this->postJson('/api/employee', [
            'name' => 'Juan Pérez',
            'phone' => '5512345678',
            'salary' => 2000,
            'salary_period' => 'monthly',
            'work_days' => ['sat', 'sun'],
        ], $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.name', 'Juan Pérez')
            ->assertJsonPath('data.salary_period', 'monthly')
            ->assertJsonPath('data.work_days', ['sat', 'sun'])
            ->assertJsonPath('data.active', true);

        $this->assertDatabaseHas('employees', ['name' => 'Juan Pérez', 'active' => true]);
    }

    public function test_no_crea_empleado_sin_nombre(): void
    {
        $this->postJson('/api/employee', [
            'salary' => 100,
            'salary_period' => 'daily',
            'work_days' => ['mon'],
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_empleado_sin_dias_de_trabajo(): void
    {
        $this->postJson('/api/employee', [
            'name' => 'Juan Pérez',
            'salary' => 100,
            'salary_period' => 'daily',
            'work_days' => [],
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_crea_empleado_con_periodicidad_fin_de_semana(): void
    {
        $response = $this->postJson('/api/employee', [
            'name' => 'Juan Pérez',
            'salary' => 300,
            'salary_period' => 'weekend',
            'work_days' => ['fri', 'sat', 'sun'],
        ], $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('data.salary_period', 'weekend')
            ->assertJsonPath('data.work_days', ['fri', 'sat', 'sun']);
    }

    public function test_no_crea_empleado_con_periodicidad_invalida(): void
    {
        $this->postJson('/api/employee', [
            'name' => 'Juan Pérez',
            'salary' => 100,
            'salary_period' => 'yearly',
            'work_days' => ['mon'],
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_empleado_no_puede_crear_empleado(): void
    {
        $empleado = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();

        $this->postJson('/api/employee', [
            'name' => 'Juan Pérez',
            'salary' => 100,
            'salary_period' => 'daily',
            'work_days' => ['mon'],
        ], $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    // ── Show ─────────────────────────────────────────────────

    public function test_muestra_empleado(): void
    {
        $employee = $this->crearEmpleado();

        $this->getJson("/api/employee/{$employee->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.id', $employee->id);
    }

    public function test_empleado_inexistente_retorna_404(): void
    {
        $this->getJson('/api/employee/99999', $this->authHeaders())
            ->assertStatus(404);
    }

    // ── Update ───────────────────────────────────────────────

    public function test_actualiza_empleado(): void
    {
        $employee = $this->crearEmpleado();

        $this->putJson("/api/employee/{$employee->id}", [
            'name' => 'Nombre Actualizado',
            'phone' => '5599998888',
            'salary' => 3000,
            'salary_period' => 'biweekly',
            'work_days' => ['mon', 'wed', 'fri'],
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.name', 'Nombre Actualizado')
            ->assertJsonPath('data.work_days', ['mon', 'wed', 'fri']);

        $this->assertDatabaseHas('employees', ['id' => $employee->id, 'name' => 'Nombre Actualizado']);
    }

    // ── Toggle active ────────────────────────────────────────

    public function test_alterna_empleado_activo(): void
    {
        $employee = $this->crearEmpleado();
        $this->assertTrue((bool) $employee->fresh()->active);

        $this->patchJson("/api/employee/{$employee->id}/toggle-active", [], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.active', false);

        $this->assertDatabaseHas('employees', ['id' => $employee->id, 'active' => false]);

        $this->patchJson("/api/employee/{$employee->id}/toggle-active", [], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.active', true);
    }

    public function test_empleado_no_puede_alternar_empleado_activo(): void
    {
        $employee = $this->crearEmpleado();
        $empleado = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();

        $this->patchJson("/api/employee/{$employee->id}/toggle-active", [], $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    // ── Delete ───────────────────────────────────────────────

    public function test_elimina_empleado(): void
    {
        $employee = $this->crearEmpleado();

        $this->deleteJson("/api/employee/{$employee->id}", [], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertSoftDeleted('employees', ['id' => $employee->id]);
    }

    public function test_empleado_no_puede_eliminar_empleado(): void
    {
        $employee = $this->crearEmpleado();
        $empleado = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();

        $this->deleteJson("/api/employee/{$employee->id}", [], $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    // ── Auth ─────────────────────────────────────────────────

    public function test_sin_autenticacion_no_accede_a_index(): void
    {
        $this->getJson('/api/employee')->assertStatus(401);
    }

    public function test_sin_autenticacion_no_accede_a_store(): void
    {
        $this->postJson('/api/employee', ['name' => 'Juan Pérez'])
            ->assertStatus(401);
    }

    // ── Aislamiento multi-tenant ──────────────────────────────

    public function test_aislamiento_multi_tenant_empleados(): void
    {
        $employeeA = $this->crearEmpleado(['name' => 'Empleado tenant A']);

        $tenantB = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'tenant-b-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Tenant B',
            BusinessConfigModel::PRIMARY_COLOR => '#F59E0B',
            BusinessConfigModel::SIDEBAR_COLOR => '#1C1917',
            BusinessConfigModel::FONT_COLOR => '#FFFFFF',
            BusinessConfigModel::LABEL_COLOR => '#1C1917',
            BusinessConfigModel::SUBSCRIPTION_PLAN => 'lifetime',
        ]);

        $adminB = User::create([
            User::NOMBRE => 'Admin',
            User::APELLIDO_PATERNO => 'B',
            User::APELLIDO_MATERNO => '',
            User::EMAIL => 'admin-b-'.uniqid().'@test.com',
            User::USUARIO => 'admin-b-'.uniqid(),
            User::PASSWORD => bcrypt('password123'),
            User::ROL_ID => RoleEnum::ADMIN->value,
            User::ACTIVO => true,
            User::TENANT_ID => $tenantB->id,
        ]);

        $this->getJson("/api/employee/{$employeeA->id}", $this->authHeaders($adminB))
            ->assertStatus(404);

        $this->putJson("/api/employee/{$employeeA->id}", [
            'name' => 'Intento cross-tenant',
            'salary' => 100,
            'salary_period' => 'daily',
            'work_days' => ['mon'],
        ], $this->authHeaders($adminB))
            ->assertStatus(404);

        $response = $this->getJson('/api/employee?limit=50', $this->authHeaders($adminB))
            ->assertStatus(206);

        $names = array_column($response->json('data'), 'name');
        $this->assertNotContains('Empleado tenant A', $names);
    }
}
