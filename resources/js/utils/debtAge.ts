export type DebtAgeTone = "attention" | "stagnant" | "critical";

/** Gravedad de los días que un cliente lleva sin abonar: menos de 30 atención, 30-59 estancado, 60 o más crítico. */
export const getDebtAgeTone = (days: number): DebtAgeTone => {
    if (days >= 60) return "critical";
    if (days >= 30) return "stagnant";
    return "attention";
};

/** Antigüedad legible del último abono: "Hoy", "Ayer" o "N días". */
export const formatDaysAgo = (days: number): string => {
    if (days === 0) return "Hoy";
    if (days === 1) return "Ayer";
    return `${days} días`;
};
