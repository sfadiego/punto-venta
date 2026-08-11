import { SubscriptionPlanEnum } from "@/enums/SubscriptionPlanEnum";

const pad = (n: number) => String(n).padStart(2, "0");

/** Devuelve la fecha local del cliente en formato YYYY-MM-DD (sin conversión UTC). */
export const localDateString = (date = new Date()): string => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Parsea una cadena YYYY-MM-DD como fecha local (sin desfase UTC). */
export const parseDateLocal = (dateStr: string): Date | null => {
    const parts = dateStr.split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
};

/** Formatea una fecha ISO a hora local en formato HH:MM (es-MX). */
export const formatOrderTime = (dateStr: string): string =>
    new Date(dateStr).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

/** Formatea una fecha ISO a fecha + hora local, ej. "20 jul 2026, 14:35" (es-MX). */
export const formatOrderDateTime = (dateStr: string): string =>
    new Date(dateStr).toLocaleString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

/** Formatea una fecha YYYY-MM-DD a texto largo local, ej. "20 de julio de 2026" (es-MX). */
export const formatDateLabel = (fecha: string): string =>
    new Date(fecha + "T00:00:00").toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

/** Formatea un mes YYYY-MM a texto largo local, ej. "Julio 2026" (es-MX). */
export const formatMonthLabel = (mes: string): string => {
    const [year, month] = mes.split("-").map(Number);
    const label = new Date(year, month - 1, 1).toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric",
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
};

/** Devuelve el lunes (YYYY-MM-DD) de la semana que contiene la fecha dada (hoy por defecto). */
export const getWeekStart = (date: Date = new Date()): string => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diffToMonday);
    return localDateString(d);
};

/** Desplaza una semana (YYYY-MM-DD, lunes) N semanas hacia adelante/atrás. */
export const shiftWeek = (semana: string, weeks: number): string => {
    const d = parseDateLocal(semana);
    if (!d) return semana;
    d.setDate(d.getDate() + weeks * 7);
    return localDateString(d);
};

/** Formatea el rango de una semana (lunes YYYY-MM-DD) a texto corto, ej. "21 - 27 jul 2026". */
export const formatWeekLabel = (semana: string): string => {
    const start = parseDateLocal(semana);
    if (!start) return "";
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const startDay = start.getDate();
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    const endLabel = end.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

    if (sameMonth) {
        return `${startDay} - ${endLabel}`;
    }

    const startLabel = start.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        ...(start.getFullYear() !== end.getFullYear() ? { year: "numeric" as const } : {}),
    });
    return `${startLabel} - ${endLabel}`;
};

/** Resuelve la etiqueta del periodo activo de un reporte (día > semana > mes), null si ninguno. */
export const resolveReportPeriodLabel = (
    fecha?: string | null,
    semana?: string | null,
    mes?: string | null,
): string | null => {
    if (fecha) return formatDateLabel(fecha);
    if (semana) return formatWeekLabel(semana);
    if (mes) return formatMonthLabel(mes);
    return null;
};

type DateMutator = (d: Date) => void;

// null = plan sin vencimiento (Lifetime). undefined = plan desconocido → también retorna null.
const PLAN_OFFSET: Partial<Record<SubscriptionPlanEnum, DateMutator | null>> = {
    [SubscriptionPlanEnum.Lifetime]: null,
    [SubscriptionPlanEnum.Weekly]:   (d) => d.setDate(d.getDate() + 7),
    [SubscriptionPlanEnum.Biweekly]: (d) => d.setDate(d.getDate() + 14),
    [SubscriptionPlanEnum.Monthly]:  (d) => d.setMonth(d.getMonth() + 1),
    [SubscriptionPlanEnum.Biannual]: (d) => d.setMonth(d.getMonth() + 6),
    [SubscriptionPlanEnum.Annual]:   (d) => d.setMonth(d.getMonth() + 12),
};

/** Días transcurridos desde una fecha ISO hasta ahora (null si no hay fecha). */
export const daysSince = (dateStr: string | null | undefined): number | null => {
    if (!dateStr) return null;
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/** Calcula la fecha de expiración de una suscripción a partir del plan y la fecha de inicio. */
export const computeExpiresAt = (plan: string, startsAt: string): string | null => {
    const d = parseDateLocal(startsAt);
    if (!d) return null;

    const offset = PLAN_OFFSET[plan as SubscriptionPlanEnum];
    if (!offset) return null;

    offset(d);
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
};
