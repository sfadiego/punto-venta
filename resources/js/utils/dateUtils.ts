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

/** Calcula la fecha de expiración de una suscripción a partir del plan y la fecha de inicio. */
export const computeExpiresAt = (plan: string, startsAt: string): string | null => {
    const d = parseDateLocal(startsAt);
    if (!d) return null;

    if (plan === SubscriptionPlanEnum.Lifetime) return null;
    if (plan === SubscriptionPlanEnum.Weekly) d.setDate(d.getDate() + 7);
    else if (plan === SubscriptionPlanEnum.Biweekly) d.setDate(d.getDate() + 14);
    else {
        const months: Record<string, number> = { monthly: 1, biannual: 6, annual: 12 };
        const m = months[plan] ?? 0;
        if (m === 0) return null;
        d.setMonth(d.getMonth() + m);
    }

    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
};
