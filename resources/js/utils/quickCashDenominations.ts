export interface IQuickCashOption {
    value: number;
    label: string;
    isExact: boolean;
}

// Billetes mexicanos de mayor a menor — el orden importa: se recorren de mayor a menor para
// preferir combinaciones con pocos billetes grandes sobre muchos billetes chicos.
const DENOMINATIONS = [1000, 500, 200, 100, 50, 20];

// Tope de billetes por combinación — evita ofrecer algo como "20 × $50" para pagar $1,000,
// que ningún cliente entregaría así en la práctica.
const MAX_BILLS = 5;

const MAX_EXACT_OPTIONS = 4;

const MAX_ROUND_UPS = 2;

/** Botones de acceso rápido para el modal de cobro, basados en billetes reales en vez de
 *  redondeos arbitrarios:
 *  - Si el total es múltiplo exacto de una o más denominaciones (con hasta MAX_BILLS billetes),
 *    se ofrece una opción por cada una — todas pagan el total exacto, sin cambio.
 *  - Si no, se ofrece "Exacto" más hasta 2 redondeos hacia arriba con la denominación más
 *    grande que no exceda el tope de billetes. */
export const getQuickCashOptions = (total: number): IQuickCashOption[] => {
    if (total <= 0) return [];

    const exactOptions: IQuickCashOption[] = [];
    for (const denom of DENOMINATIONS) {
        if (total % denom !== 0) continue;
        const bills = total / denom;
        if (bills > MAX_BILLS) continue;
        exactOptions.push({ value: total, label: `${bills} × $${denom}`, isExact: false });
    }

    if (exactOptions.length > 0) return exactOptions.slice(0, MAX_EXACT_OPTIONS);

    const roundUps: IQuickCashOption[] = [];
    for (const denom of DENOMINATIONS) {
        const bills = Math.ceil(total / denom);
        if (bills > MAX_BILLS) continue;
        const value = bills * denom;
        if (roundUps.some((o) => o.value === value)) continue;
        roundUps.push({ value, label: `${bills} × $${denom}`, isExact: false });
    }
    roundUps.sort((a, b) => a.value - b.value);

    return [
        { value: total, label: "Exacto", isExact: true },
        ...roundUps.slice(0, MAX_ROUND_UPS),
    ];
};
