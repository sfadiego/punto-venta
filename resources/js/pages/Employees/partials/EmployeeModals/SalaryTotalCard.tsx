import { SalaryPeriod, WorkDay } from "@/models/IEmployee";
import { formatCurrencyTrimmed as formatCurrency } from "@/utils/formatCurrency";
import { calcSalaryForPeriod, isPerDaySalaryPeriod, SALARY_PERIOD_TOTAL_UNIT_LABELS } from "@/utils/salaryPeriodUtils";

interface SalaryTotalCardProps {
    dailySalary: number;
    period: SalaryPeriod;
    workDays: WorkDay[];
}

export const SalaryTotalCard = ({ dailySalary, period, workDays }: SalaryTotalCardProps) => {
    if (!dailySalary) return null;
    if (isPerDaySalaryPeriod(period) && workDays.length === 0) return null;

    const total = calcSalaryForPeriod(dailySalary, period, workDays.length);

    return (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center">
            <p className="text-xs font-medium text-red-500 uppercase tracking-wide">Salario total acordado</p>
            <p className="text-3xl font-bold text-red-600 leading-tight mt-0.5">
                {formatCurrency(total)} <span className="text-base font-semibold">{SALARY_PERIOD_TOTAL_UNIT_LABELS[period]}</span>
            </p>
        </div>
    );
};
