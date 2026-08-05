import { WorkDay } from "@/models/IEmployee";

export const WORK_DAYS_ORDER: WorkDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const WORK_DAY_LABELS: Record<WorkDay, string> = {
    mon: "Lun",
    tue: "Mar",
    wed: "Mié",
    thu: "Jue",
    fri: "Vie",
    sat: "Sáb",
    sun: "Dom",
};

export const WEEKDAYS: WorkDay[] = ["mon", "tue", "wed", "thu", "fri"];
export const WEEKEND_DAYS: WorkDay[] = ["fri", "sat", "sun"];

const SHORT_WEEKEND: WorkDay[] = ["sat", "sun"];

const sameDays = (a: WorkDay[], b: WorkDay[]): boolean =>
    a.length === b.length && b.every((day) => a.includes(day));

export const sortWorkDays = (days: WorkDay[]): WorkDay[] =>
    WORK_DAYS_ORDER.filter((day) => days.includes(day));

export const formatWorkDays = (days: WorkDay[]): string => {
    if (days.length === 7) return "Toda la semana";
    if (sameDays(days, WEEKDAYS)) return "Lunes a viernes";
    if (sameDays(days, WEEKEND_DAYS) || sameDays(days, SHORT_WEEKEND)) return "Fines de semana";
    return sortWorkDays(days).map((day) => WORK_DAY_LABELS[day]).join(", ");
};
