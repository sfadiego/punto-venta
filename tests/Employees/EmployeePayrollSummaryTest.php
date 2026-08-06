<?php

namespace Tests\Employees;

use App\Models\BusinessConfigModel;
use App\Models\EmployeeModel;
use Tests\TestCase;

class EmployeePayrollSummaryTest extends TestCase
{
    private function crearEmpleado(array $overrides = []): EmployeeModel
    {
        return EmployeeModel::create(array_merge([
            EmployeeModel::NAME => 'Empleado Test '.uniqid(),
            EmployeeModel::PHONE => '5512345678',
            EmployeeModel::SALARY => 1500,
            EmployeeModel::SALARY_PERIOD => 'weekly',
            EmployeeModel::WORK_DAYS => ['mon', 'tue', 'wed', 'thu', 'fri'],
            EmployeeModel::ACTIVE => true,
            EmployeeModel::TENANT_ID => BusinessConfigModel::first()->id,
        ], $overrides));
    }

    public function test_resumen_por_defecto_es_mensual(): void
    {
        $this->crearEmpleado(['salary' => 9000, 'salary_period' => 'monthly', 'work_days' => []]);

        $this->getJson('/api/employee/payroll-summary', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.period', 'month')
            ->assertJsonPath('data.total', 9000);
    }

    public function test_resumen_semanal_periodo_por_dia(): void
    {
        // salario diario 200, 5 días a la semana → 200 * 5 = 1000 por semana
        $this->crearEmpleado(['salary' => 200, 'salary_period' => 'weekly', 'work_days' => ['mon', 'tue', 'wed', 'thu', 'fri']]);

        $this->getJson('/api/employee/payroll-summary?period=week', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.period', 'week')
            ->assertJsonPath('data.total', 1000)
            ->assertJsonPath('data.employees_count', 1);
    }

    public function test_resumen_mensual_periodo_por_dia(): void
    {
        // 1000/semana proyectado a mes (30 días) → 1000 * 30/7 ≈ 4285.71
        $this->crearEmpleado(['salary' => 200, 'salary_period' => 'weekly', 'work_days' => ['mon', 'tue', 'wed', 'thu', 'fri']]);

        $this->getJson('/api/employee/payroll-summary?period=month', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total', 4285.71);
    }

    public function test_resumen_mensual_empleado_quincenal(): void
    {
        // salario quincenal fijo 3000 → equivalente mensual 3000/15*30 = 6000
        $this->crearEmpleado(['salary' => 3000, 'salary_period' => 'biweekly', 'work_days' => []]);

        $this->getJson('/api/employee/payroll-summary?period=month', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total', 6000);
    }

    public function test_resumen_semanal_empleado_quincenal(): void
    {
        // 3000/15*7 = 1400
        $this->crearEmpleado(['salary' => 3000, 'salary_period' => 'biweekly', 'work_days' => []]);

        $this->getJson('/api/employee/payroll-summary?period=week', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total', 1400);
    }

    public function test_resumen_mensual_empleado_fijo_es_su_salario_tal_cual(): void
    {
        $this->crearEmpleado(['salary' => 9000, 'salary_period' => 'monthly', 'work_days' => []]);

        $this->getJson('/api/employee/payroll-summary?period=month', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total', 9000);
    }

    public function test_resumen_suma_varios_empleados(): void
    {
        $this->crearEmpleado(['salary' => 9000, 'salary_period' => 'monthly', 'work_days' => []]);
        $this->crearEmpleado(['salary' => 3000, 'salary_period' => 'biweekly', 'work_days' => []]);

        $this->getJson('/api/employee/payroll-summary?period=month', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total', 15000)
            ->assertJsonPath('data.employees_count', 2);
    }

    public function test_resumen_excluye_empleados_inactivos(): void
    {
        $this->crearEmpleado(['salary' => 9000, 'salary_period' => 'monthly', 'work_days' => [], 'active' => true]);
        $this->crearEmpleado(['salary' => 5000, 'salary_period' => 'monthly', 'work_days' => [], 'active' => false]);

        $this->getJson('/api/employee/payroll-summary?period=month', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total', 9000)
            ->assertJsonPath('data.employees_count', 1);
    }

    public function test_resumen_sin_empleados_retorna_cero(): void
    {
        $this->getJson('/api/employee/payroll-summary', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total', 0)
            ->assertJsonPath('data.employees_count', 0);
    }

    public function test_no_acepta_periodo_invalido(): void
    {
        $this->getJson('/api/employee/payroll-summary?period=year', $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_resumen_sin_autenticacion(): void
    {
        $this->getJson('/api/employee/payroll-summary')->assertStatus(401);
    }

    public function test_resumen_no_incluye_empleados_de_otro_tenant(): void
    {
        $this->crearEmpleado(['salary' => 9000, 'salary_period' => 'monthly', 'work_days' => []]);

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

        $this->crearEmpleado([
            'name' => 'Empleado tenant B',
            'salary' => 20000,
            'salary_period' => 'monthly',
            'work_days' => [],
            'tenant_id' => $tenantB->id,
        ]);

        $this->getJson('/api/employee/payroll-summary?period=month', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total', 9000)
            ->assertJsonPath('data.employees_count', 1);
    }
}
