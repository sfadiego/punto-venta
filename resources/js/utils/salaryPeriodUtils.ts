import { SalaryPeriod, WorkDay } from "@/models/IEmployee";
import { WEEKDAYS, WEEKEND_DAYS, WORK_DAYS_ORDER } from "@/utils/workDaysUtils";

export const SALARY_PERIOD_LABELS: Record<SalaryPeriod, string> = {
    daily: "Diario",
    weekly: "Semanal",
    weekend: "Fines de semana",
    biweekly: "Quincenal",
    monthly: "Mensual",
};

export const getSalaryPeriodLabel = (period: SalaryPeriod): string => SALARY_PERIOD_LABELS[period];

export const SALARY_PERIOD_UNIT_LABELS: Record<SalaryPeriod, string> = {
    daily: "por día",
    weekly: "por semana",
    weekend: "por fin de semana",
    biweekly: "por quincena",
    monthly: "por mes (aprox.)",
};

// Periodos cuyos días laborales se autocompletan al seleccionarlos — el usuario puede
// seguir des/marcando días individuales después (ej. quitar el viernes del fin de semana).
export const SALARY_PERIOD_DEFAULT_WORK_DAYS: Partial<Record<SalaryPeriod, WorkDay[]>> = {
    daily: WORK_DAYS_ORDER,
    weekly: WEEKDAYS,
    weekend: WEEKEND_DAYS,
};

const WEEKS_PER_MONTH = 52 / 12;

/** Estima el pago total del período a partir del salario diario y la cantidad de días
 *  trabajados por semana. Quincenal/mensual son aproximados (asumen semanas regulares). */
export const calcSalaryForPeriod = (dailySalary: number, period: SalaryPeriod, workDaysCount: number): number => {
    switch (period) {
        case "daily":
            return dailySalary;
        case "weekly":
        case "weekend":
            return dailySalary * workDaysCount;
        case "biweekly":
            return dailySalary * workDaysCount * 2;
        case "monthly":
            return dailySalary * workDaysCount * WEEKS_PER_MONTH;
    }
};
