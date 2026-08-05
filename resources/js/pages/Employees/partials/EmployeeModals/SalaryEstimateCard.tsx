import { Calculator } from "lucide-react";
import { SalaryPeriod } from "@/models/IEmployee";
import { formatCurrencyTrimmed as formatCurrency } from "@/utils/formatCurrency";
import { calcSalaryForPeriod, SALARY_PERIOD_UNIT_LABELS } from "@/utils/salaryPeriodUtils";

interface SalaryEstimateCardProps {
    dailySalary: number;
    period: SalaryPeriod;
    workDaysCount: number;
}

export const SalaryEstimateCard = ({ dailySalary, period, workDaysCount }: SalaryEstimateCardProps) => {
    if (!dailySalary || workDaysCount === 0) return null;

    const total = calcSalaryForPeriod(dailySalary, period, workDaysCount);
    const weeklyTotal = calcSalaryForPeriod(dailySalary, "weekly", workDaysCount);

    return (
        <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
            <Calculator size={15} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
                {period === "daily" ? (
                    <>
                        Se le pagará <span className="font-semibold">{formatCurrency(total)}</span> por cada día trabajado.
                        {" "}Con {workDaysCount} {workDaysCount === 1 ? "día" : "días"} a la semana, eso equivale a{" "}
                        {formatCurrency(dailySalary)} × {workDaysCount} ={" "}
                        <span className="font-semibold">{formatCurrency(weeklyTotal)}</span> por semana.
                    </>
                ) : (
                    <>
                        Con {formatCurrency(dailySalary)} por día y {workDaysCount} {workDaysCount === 1 ? "día" : "días"} a la semana,
                        el pago {SALARY_PERIOD_UNIT_LABELS[period]} es de aproximadamente{" "}
                        <span className="font-semibold">{formatCurrency(total)}</span>.
                    </>
                )}
            </p>
        </div>
    );
};
