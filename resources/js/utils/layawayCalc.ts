// Valores por defecto de apartados — espejo de los defaults de business_config
// (layaway_min_percent / layaway_days), usados mientras la configuración no ha cargado.
export const DEFAULT_LAYAWAY_MIN_PERCENT = 10;
export const DEFAULT_LAYAWAY_DAYS = 30;
export const DEFAULT_LAYAWAY_RETENTION_PERCENT = 0;

const PERCENT_OPTIONS = [10, 20, 30, 50];

const roundCents = (value: number): number => Math.round(value * 100) / 100;

/** Monto equivalente a un porcentaje del total, redondeado a centavos. */
export const calcDepositFromPercent = (total: number, percent: number): number =>
    roundCents((total * percent) / 100);

/** Anticipo mínimo en pesos según el porcentaje configurado del negocio. */
export const calcMinDeposit = (total: number, minPercent: number): number =>
    calcDepositFromPercent(total, minPercent);

/** Saldo pendiente tras el anticipo (nunca negativo). */
export const calcLayawayBalance = (total: number, deposit: number): number =>
    Math.max(roundCents(total - deposit), 0);

/** Porcentajes ofrecidos como atajo: los fijos que alcanzan el mínimo, empezando por el mínimo. */
export const getLayawayPercentOptions = (minPercent: number): number[] => [
    minPercent,
    ...PERCENT_OPTIONS.filter((percent) => percent > minPercent),
];

/** Progreso de un apartado (0-100) según lo abonado. */
export const calcLayawayProgress = (total: number, paid: number): number =>
    total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;

// Días de anticipación desde los que un apartado se marca "por vencer".
export const LAYAWAY_SOON_DAYS = 7;

export type LayawayDueTone = "ok" | "soon" | "overdue";

export interface ILayawayDueInfo {
    label: string;
    tone: LayawayDueTone;
}

const pluralizeDays = (days: number): string => `${days} ${days === 1 ? "día" : "días"}`;

/** Etiqueta y tono del vencimiento de un apartado a partir de los días que faltan (null = sin fecha). */
export const getLayawayDueInfo = (daysLeft: number | null): ILayawayDueInfo => {
    if (daysLeft === null) return { label: "Sin fecha", tone: "ok" };
    if (daysLeft < 0) return { label: `Venció hace ${pluralizeDays(Math.abs(daysLeft))}`, tone: "overdue" };
    if (daysLeft === 0) return { label: "Vence hoy", tone: "soon" };
    if (daysLeft <= LAYAWAY_SOON_DAYS) return { label: `En ${pluralizeDays(daysLeft)}`, tone: "soon" };
    return { label: `En ${pluralizeDays(daysLeft)}`, tone: "ok" };
};

const RETENTION_PERCENT_OPTIONS = [10, 20, 30, 50];

/** Porcentajes ofrecidos como atajo al retener: los fijos más el sugerido por el negocio (si no está ya). */
export const getRetentionPercentOptions = (suggestedPercent: number): number[] =>
    suggestedPercent > 0 && !RETENTION_PERCENT_OPTIONS.includes(suggestedPercent)
        ? [suggestedPercent, ...RETENTION_PERCENT_OPTIONS]
        : RETENTION_PERCENT_OPTIONS;

/** Reparte lo abonado entre lo que se reembolsa y lo que el negocio retiene (la retención se acota a lo abonado). */
export const splitLayawayRefund = (paid: number, retained: number): { retained: number; refund: number } => {
    const safeRetained = Math.min(Math.max(roundCents(retained), 0), paid);
    return { retained: safeRetained, refund: roundCents(paid - safeRetained) };
};
