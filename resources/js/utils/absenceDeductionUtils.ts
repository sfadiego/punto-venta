import { SalaryPeriod } from "@/models/IEmployee";
import { getWeekStart, localDateString, parseDateLocal } from "@/utils/dateUtils";
import { isPerDaySalaryPeriod } from "@/utils/salaryPeriodUtils";

export interface DateRange {
    start: string;
    end: string;
}

/** Rango de fechas del periodo de pago actual, usado para filtrar qué faltas cuentan
 *  como "de este periodo" en el card de descuento. Quincenal usa los cortes 1-15 / 16-fin
 *  de mes; mensual usa el mes calendario; el resto usa la semana (lunes a domingo) actual. */
export const getCurrentPeriodRange = (period: SalaryPeriod, referenceDate: Date = new Date()): DateRange => {
    if (period === "biweekly") {
        const day = referenceDate.getDate();
        const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), day <= 15 ? 1 : 16);
        const end = day <= 15
            ? new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 15)
            : new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
        return { start: localDateString(start), end: localDateString(end) };
    }

    if (period === "monthly") {
        const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
        const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
        return { start: localDateString(start), end: localDateString(end) };
    }

    const start = getWeekStart(referenceDate);
    const endDate = parseDateLocal(start) as Date;
    endDate.setDate(endDate.getDate() + 6);
    return { start, end: localDateString(endDate) };
};

export const isDateInRange = (date: string, range: DateRange): boolean => date >= range.start && date <= range.end;

/** Sugerencia de monto a descontar por una falta sin aviso, editable por el jefe antes de
 *  guardar. Periodos por día usan la tarifa diaria tal cual; quincenal/mensual derivan un
 *  equivalente diario con la convención estándar de nómina en México (salario ÷ 15 o ÷ 30).
 *  `salary` puede llegar como string desde la API (Laravel serializa los `decimal:2` así). */
export const getSuggestedDeductionAmount = (salary: number | string, period: SalaryPeriod): number => {
    const value = Number(salary);
    if (isPerDaySalaryPeriod(period)) return value;
    if (period === "biweekly") return value / 15;
    return value / 30;
};
