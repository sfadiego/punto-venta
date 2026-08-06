import { Calculator } from "lucide-react";
import { SalaryPeriod, WorkDay } from "@/models/IEmployee";
import { formatCurrencyTrimmed as formatCurrency } from "@/utils/formatCurrency";
import { formatWorkDays } from "@/utils/workDaysUtils";
import { calcSalaryForPeriod, isPerDaySalaryPeriod, SALARY_PERIOD_PAYMENT_LABELS, SALARY_PERIOD_UNIT_LABELS } from "@/utils/salaryPeriodUtils";

interface SalaryEstimateCardProps {
    dailySalary: number;
    period: SalaryPeriod;
    workDays: WorkDay[];
}

export const SalaryEstimateCard = ({ dailySalary, period, workDays }: SalaryEstimateCardProps) => {
    if (!dailySalary) return null;

    const workDaysCount = workDays.length;

    if (!isPerDaySalaryPeriod(period)) {
        return (
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                <Calculator size={15} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    Se le pagará <span className="font-semibold">{formatCurrency(dailySalary)}</span>{" "}
                    {SALARY_PERIOD_PAYMENT_LABELS[period]}
                    {workDaysCount > 0 && (
                        <>
                            , los días <span className="font-semibold">{formatWorkDays(workDays)}</span>
                        </>
                    )}
                    .
                </p>
            </div>
        );
    }

    if (workDaysCount === 0) return null;

    const total = calcSalaryForPeriod(dailySalary, period, workDaysCount);
    const weeklyTotal = calcSalaryForPeriod(dailySalary, "weekly", workDaysCount);

    return (
        <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
            <Calculator size={15} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
                {period === "daily" ? (
                    <>
                        Se le pagará <span className="font-semibold">{formatCurrency(total)}</span> por cada día trabajado.
                        {" "}Con {workDaysCount} {workDaysCount === 1 ? "día" : "días"} a la semana ({formatWorkDays(workDays)}), eso equivale a{" "}
                        {formatCurrency(dailySalary)} × {workDaysCount} ={" "}
                        <span className="font-semibold">{formatCurrency(weeklyTotal)}</span> por semana.
                    </>
                ) : (
                    <>
                        Con {formatCurrency(dailySalary)} por día y {workDaysCount} {workDaysCount === 1 ? "día" : "días"} a la semana
                        ({formatWorkDays(workDays)}), el pago {SALARY_PERIOD_UNIT_LABELS[period]} es de aproximadamente{" "}
                        <span className="font-semibold">{formatCurrency(total)}</span>.
                    </>
                )}
            </p>
        </div>
    );
};
