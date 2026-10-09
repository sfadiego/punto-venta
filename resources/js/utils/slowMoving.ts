// Umbral por defecto del reporte de productos sin movimiento — espejo de
// SlowMovingProductsReport::DEFAULT_DAYS (backend).
export const DEFAULT_SLOW_MOVING_DAYS = 60;

export const SLOW_MOVING_DAY_OPTIONS = [30, 60, 90, 180];

export type SlowMovingTone = "attention" | "stagnant" | "critical";

/** Gravedad según los días sin movimiento: menos de 60 atención, 60-89 estancado, 90 o más crítico. */
export const getSlowMovingTone = (daysIdle: number): SlowMovingTone => {
    if (daysIdle >= 90) return "critical";
    if (daysIdle >= 60) return "stagnant";
    return "attention";
};
