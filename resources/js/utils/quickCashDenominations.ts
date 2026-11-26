export interface IQuickCashOption {
    value: number;
    label: string;
    isExact: boolean;
}

// Billetes mexicanos de mayor a menor — el orden importa: se recorren de mayor a menor para
// preferir combinaciones con pocos billetes grandes sobre muchos billetes chicos.
const DENOMINATIONS = [500, 200, 100, 50, 20];

// Tope de billetes por combinación — evita ofrecer algo como "10 × $50" para pagar $500,
// que ningún cliente entregaría así en la práctica.
const MAX_BILLS = 5;

const MAX_ROUND_UPS = 2;

/** Botones de acceso rápido para el modal de cobro, basados en billetes reales en vez de
 *  redondeos arbitrarios: "Exacto" más hasta MAX_ROUND_UPS redondeos hacia arriba (mayores al
 *  total) con las denominaciones que no excedan el tope de billetes. */
export const getQuickCashOptions = (total: number): IQuickCashOption[] => {
    if (total <= 0) return [];

    const roundUps: IQuickCashOption[] = [];
    for (const denom of DENOMINATIONS) {
        const bills = Math.ceil(total / denom);
        if (bills > MAX_BILLS) continue;
        const value = bills * denom;
        if (value === total || roundUps.some((o) => o.value === value)) continue;
        roundUps.push({ value, label: `${bills} × $${denom}`, isExact: false });
    }
    roundUps.sort((a, b) => a.value - b.value);

    return [
        { value: total, label: "Exacto", isExact: true },
        ...roundUps.slice(0, MAX_ROUND_UPS),
    ];
};
