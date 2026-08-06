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

// Periodos "por día trabajado": el monto capturado es una tarifa diaria y el pago del
// periodo se deriva multiplicando por los días de la semana marcados. Quincenal/mensual
// son periodos de "sueldo fijo": el monto capturado ya es el pago final del periodo.
const PER_DAY_SALARY_PERIODS: SalaryPeriod[] = ["daily", "weekly", "weekend"];

export const isPerDaySalaryPeriod = (period: SalaryPeriod): boolean => PER_DAY_SALARY_PERIODS.includes(period);

export const SALARY_AMOUNT_FIELD_LABELS: Record<SalaryPeriod, string> = {
    daily: "Salario por día",
    weekly: "Salario por día",
    weekend: "Salario por día",
    biweekly: "Salario quincenal",
    monthly: "Salario mensual",
};

export const SALARY_PERIOD_UNIT_LABELS: Record<SalaryPeriod, string> = {
    daily: "por día",
    weekly: "por semana",
    weekend: "por fin de semana",
    biweekly: "por quincena",
    monthly: "por mes (aprox.)",
};

// Texto usado en el card para periodos de sueldo fijo, donde el monto ya es el pago final.
export const SALARY_PERIOD_PAYMENT_LABELS: Partial<Record<SalaryPeriod, string>> = {
    biweekly: "cada quincena",
    monthly: "cada mes",
};

// Igual que SALARY_PERIOD_UNIT_LABELS pero sin la marca "(aprox.)" — se usa en el card de
// salario total, donde el monto mostrado es siempre exacto (dato capturado o multiplicación
// directa), nunca una estimación.
export const SALARY_PERIOD_TOTAL_UNIT_LABELS: Record<SalaryPeriod, string> = {
    daily: "por día",
    weekly: "por semana",
    weekend: "por fin de semana",
    biweekly: "por quincena",
    monthly: "por mes",
};

// Periodos cuyos días laborales se autocompletan al seleccionarlos — el usuario puede
// seguir des/marcando días individuales después (ej. quitar el viernes del fin de semana).
// Quincenal/mensual no aparecen aquí: en esos periodos los días son solo referencia de
// horario y no alimentan ningún cálculo, así que no hace falta un valor por defecto.
export const SALARY_PERIOD_DEFAULT_WORK_DAYS: Partial<Record<SalaryPeriod, WorkDay[]>> = {
    daily: WORK_DAYS_ORDER,
    weekly: WEEKDAYS,
    weekend: WEEKEND_DAYS,
};

/** Estima el pago del período a partir del salario diario y la cantidad de días trabajados
 *  por semana. Solo aplica a los periodos "por día trabajado" — quincenal/mensual no derivan
 *  el pago, el usuario captura directamente el monto fijo del periodo. */
export const calcSalaryForPeriod = (dailySalary: number, period: SalaryPeriod, workDaysCount: number): number => {
    switch (period) {
        case "daily":
            return dailySalary;
        case "weekly":
        case "weekend":
            return dailySalary * workDaysCount;
        default:
            return dailySalary;
    }
};
