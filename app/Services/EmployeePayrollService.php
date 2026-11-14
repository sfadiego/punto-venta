<?php

namespace App\Services;

use App\Models\EmployeeAbsenceModel;
use App\Models\EmployeeModel;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class EmployeePayrollService
{
    private const PER_DAY_PERIODS = ['daily', 'weekly', 'weekend'];

    private const WEEK_DAYS = 7;

    private const BIWEEKLY_DAYS = 15;

    private const MONTH_DAYS = 30;

    /** Suma el costo proyectado de nómina de los empleados activos para el periodo dado
     *  ("week" o "month"), ya sin los descuentos de las faltas que caen en ese periodo (la
     *  semana de lunes a domingo, o el mes calendario). Es una estimación informativa, no un
     *  registro de pagos reales: ningún periodo calendario encaja exacto con semanas/quincenas/
     *  meses reales. El descuento se aplica por empleado y nunca lo deja por debajo de cero.
     *  `deductions` es lo realmente restado: `total + deductions` es el costo antes de faltas. */
    public function summary(string $period): array
    {
        $employees = EmployeeModel::where(EmployeeModel::ACTIVE, true)->get();
        $deductions = $this->deductionsByEmployee($employees, $period);

        $gross = 0.0;
        $net = 0.0;
        foreach ($employees as $employee) {
            $cost = $this->costFor($employee, $period);
            $gross += $cost;
            $net += max(0, $cost - $deductions->get($employee->id, 0.0));
        }

        return [
            'period' => $period,
            'total' => round($net, 2),
            'deductions' => round($gross - $net, 2),
            'employees_count' => $employees->count(),
        ];
    }

    /** Descuento total por empleado (id => monto) de las faltas con descuento dentro del periodo. */
    private function deductionsByEmployee(Collection $employees, string $period): Collection
    {
        $today = Carbon::now();
        [$start, $end] = $period === 'week'
            ? [$today->copy()->startOfWeek(Carbon::MONDAY), $today->copy()->endOfWeek(Carbon::SUNDAY)]
            : [$today->copy()->startOfMonth(), $today->copy()->endOfMonth()];

        return EmployeeAbsenceModel::whereIn(EmployeeAbsenceModel::EMPLOYEE_ID, $employees->pluck('id'))
            ->whereBetween(EmployeeAbsenceModel::DATE, [$start->toDateString(), $end->toDateString()])
            ->whereNotNull(EmployeeAbsenceModel::DEDUCTION_AMOUNT)
            ->selectRaw(EmployeeAbsenceModel::EMPLOYEE_ID.', SUM('.EmployeeAbsenceModel::DEDUCTION_AMOUNT.') as total')
            ->groupBy(EmployeeAbsenceModel::EMPLOYEE_ID)
            ->pluck('total', EmployeeAbsenceModel::EMPLOYEE_ID)
            ->map(fn ($amount) => (float) $amount);
    }

    private function costFor(EmployeeModel $employee, string $period): float
    {
        $salary = (float) $employee->salary;
        $periodDays = $period === 'week' ? self::WEEK_DAYS : self::MONTH_DAYS;

        if (in_array($employee->salary_period, self::PER_DAY_PERIODS, true)) {
            $weeklyCost = $salary * count($employee->work_days ?? []);

            return $weeklyCost * ($periodDays / self::WEEK_DAYS);
        }

        $fixedPeriodDays = $employee->salary_period === 'biweekly' ? self::BIWEEKLY_DAYS : self::MONTH_DAYS;

        return ($salary / $fixedPeriodDays) * $periodDays;
    }
}
