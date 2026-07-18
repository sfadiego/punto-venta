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

/** Calcula la fecha de expiración de una suscripción a partir del plan y la fecha de inicio. */
export const computeExpiresAt = (plan: string, startsAt: string): string | null => {
    const d = parseDateLocal(startsAt);
    if (!d) return null;

    const offset = PLAN_OFFSET[plan as SubscriptionPlanEnum];
    if (!offset) return null;

    offset(d);
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
};
