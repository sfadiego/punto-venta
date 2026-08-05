export const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

// Igual que formatCurrency pero sin ".00" cuando el monto es exacto (ej. "$200" en vez de "$200.00"),
// conservando los centavos cuando son distintos de cero (ej. "$1,400.50").
export const formatCurrencyTrimmed = (value: number) =>
    new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);

// Recorta ".00" cuando el monto es exacto, pero conserva los centavos si son distintos de cero (ej. 1600 vs 1100.50).
export const formatMoney = (value: number): string => Number(value).toFixed(2).replace(/\.00$/, "");
