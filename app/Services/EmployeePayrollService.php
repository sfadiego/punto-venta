<?php

namespace App\Services;

use App\Models\EmployeeModel;

class EmployeePayrollService
{
    private const PER_DAY_PERIODS = ['daily', 'weekly', 'weekend'];

    private const WEEK_DAYS = 7;

    private const BIWEEKLY_DAYS = 15;

    private const MONTH_DAYS = 30;

    /** Suma el costo proyectado de nómina de los empleados activos para el periodo dado
     *  ("week" o "month"). Es una estimación informativa, no un registro de pagos reales:
     *  ningún periodo calendario encaja exacto con semanas/quincenas/meses reales. */
    public function summary(string $period): array
    {
        $employees = EmployeeModel::where(EmployeeModel::ACTIVE, true)->get();

        $total = $employees->sum(fn (EmployeeModel $employee) => $this->costFor($employee, $period));

        return [
            'period' => $period,
            'total' => round($total, 2),
            'employees_count' => $employees->count(),
        ];
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
