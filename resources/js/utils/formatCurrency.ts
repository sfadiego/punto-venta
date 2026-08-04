export const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

// Recorta ".00" cuando el monto es exacto, pero conserva los centavos si son distintos de cero (ej. 1600 vs 1100.50).
export const formatMoney = (value: number): string => Number(value).toFixed(2).replace(/\.00$/, "");
