// Recorta ceros decimales sobrantes de un valor numérico venido del backend (cast decimal:2
// serializa como string, ej. "20.00", "5.50") para mostrarlo/editarlo de forma compacta.
export const trimDecimalZeros = (value: string | number): string => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return Number.isFinite(num) ? String(num) : "";
};
