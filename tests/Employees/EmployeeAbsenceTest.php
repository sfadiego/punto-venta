<?php

namespace Tests\Employees;

use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\EmployeeAbsenceModel;
use App\Models\EmployeeModel;
use App\Models\User;
use Tests\TestCase;

class EmployeeAbsenceTest extends TestCase
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

    public function test_lista_faltas_de_empleado(): void
    {
        $employee = $this->crearEmpleado();
        $employee->absences()->create([
            EmployeeAbsenceModel::DATE => '2026-08-01',
            EmployeeAbsenceModel::NOTIFIED => false,
            EmployeeAbsenceModel::DEDUCTION_AMOUNT => 300,
            EmployeeAbsenceModel::TENANT_ID => $employee->tenant_id,
        ]);
        $employee->absences()->create([
            EmployeeAbsenceModel::DATE => '2026-08-03',
            EmployeeAbsenceModel::NOTIFIED => true,
            EmployeeAbsenceModel::TENANT_ID => $employee->tenant_id,
        ]);

        $response = $this->getJson("/api/employee/{$employee->id}/absence", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $dates = array_column($response->json('data'), 'date');
        $this->assertSame(['2026-08-03', '2026-08-01'], $dates);
    }

    // ── Store ────────────────────────────────────────────────

    public function test_registra_falta_injustificada_con_descuento(): void
    {
        $employee = $this->crearEmpleado(['salary' => 300, 'salary_period' => 'daily']);

        $response = $this->postJson("/api/employee/{$employee->id}/absence", [
            'date' => '2026-08-05',
            'notified' => false,
            'deduction_amount' => 300,
            'notes' => 'No avisó',
        ], $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.notified', false)
            ->assertJsonPath('data.date', '2026-08-05')
            ->assertJsonPath('data.notes', 'No avisó');

        $this->assertDatabaseHas('employee_absences', [
            'employee_id' => $employee->id,
            'date' => '2026-08-05',
            'notified' => false,
            'deduction_amount' => 300,
        ]);
    }

    public function test_registra_falta_justificada_sin_descuento(): void
    {
        $employee = $this->crearEmpleado();

        $response = $this->postJson("/api/employee/{$employee->id}/absence", [
            'date' => '2026-08-05',
            'notified' => true,
            'deduction_amount' => 999,
        ], $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('data.notified', true)
            ->assertJsonPath('data.deduction_amount', null);

        $this->assertDatabaseHas('employee_absences', [
            'employee_id' => $employee->id,
            'notified' => true,
            'deduction_amount' => null,
        ]);
    }

    public function test_no_registra_falta_sin_fecha(): void
    {
        $employee = $this->crearEmpleado();

        $this->postJson("/api/employee/{$employee->id}/absence", [
            'notified' => false,
            'deduction_amount' => 100,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_registra_falta_duplicada_mismo_dia(): void
    {
        $employee = $this->crearEmpleado();
        $employee->absences()->create([
            EmployeeAbsenceModel::DATE => '2026-08-05',
            EmployeeAbsenceModel::NOTIFIED => true,
            EmployeeAbsenceModel::TENANT_ID => $employee->tenant_id,
        ]);

        $this->postJson("/api/employee/{$employee->id}/absence", [
            'date' => '2026-08-05',
            'notified' => false,
            'deduction_amount' => 100,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_empleado_no_puede_registrar_falta(): void
    {
        $employee = $this->crearEmpleado();
        $empleado = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();

        $this->postJson("/api/employee/{$employee->id}/absence", [
            'date' => '2026-08-05',
            'notified' => false,
            'deduction_amount' => 100,
        ], $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    // ── Delete ───────────────────────────────────────────────

    public function test_elimina_falta(): void
    {
        $employee = $this->crearEmpleado();
        $absence = $employee->absences()->create([
            EmployeeAbsenceModel::DATE => '2026-08-05',
            EmployeeAbsenceModel::NOTIFIED => false,
            EmployeeAbsenceModel::DEDUCTION_AMOUNT => 100,
            EmployeeAbsenceModel::TENANT_ID => $employee->tenant_id,
        ]);

        $this->deleteJson("/api/employee/{$employee->id}/absence/{$absence->id}", [], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertDatabaseMissing('employee_absences', ['id' => $absence->id]);
    }

    public function test_empleado_no_puede_eliminar_falta(): void
    {
        $employee = $this->crearEmpleado();
        $absence = $employee->absences()->create([
            EmployeeAbsenceModel::DATE => '2026-08-05',
            EmployeeAbsenceModel::NOTIFIED => false,
            EmployeeAbsenceModel::DEDUCTION_AMOUNT => 100,
            EmployeeAbsenceModel::TENANT_ID => $employee->tenant_id,
        ]);
        $empleado = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();

        $this->deleteJson("/api/employee/{$employee->id}/absence/{$absence->id}", [], $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    // ── Auth ─────────────────────────────────────────────────

    public function test_sin_autenticacion_no_accede_a_faltas(): void
    {
        $employee = $this->crearEmpleado();

        $this->getJson("/api/employee/{$employee->id}/absence")->assertStatus(401);
    }

    // ── Aislamiento multi-tenant ──────────────────────────────

    public function test_aislamiento_multi_tenant_faltas(): void
    {
        $employeeA = $this->crearEmpleado(['name' => 'Empleado tenant A']);
        $employeeA->absences()->create([
            EmployeeAbsenceModel::DATE => '2026-08-05',
            EmployeeAbsenceModel::NOTIFIED => false,
            EmployeeAbsenceModel::DEDUCTION_AMOUNT => 100,
            EmployeeAbsenceModel::TENANT_ID => $employeeA->tenant_id,
        ]);

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

        $this->getJson("/api/employee/{$employeeA->id}/absence", $this->authHeaders($adminB))
            ->assertStatus(404);

        $this->postJson("/api/employee/{$employeeA->id}/absence", [
            'date' => '2026-08-06',
            'notified' => false,
            'deduction_amount' => 100,
        ], $this->authHeaders($adminB))
            ->assertStatus(404);
    }
}
