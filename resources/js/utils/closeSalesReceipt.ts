import { ILayawaySummary, IReturnsSummary } from "@/services/useOpenSalesService";
import { formatCurrency } from "@/utils/formatCurrency";

export type ReceiptRowSign = "plus" | "minus" | "none";

export interface IReceiptRow {
    key: string;
    label: string;
    note?: string;
    amount: number;
    sign: ReceiptRowSign;
    hasDetail?: boolean;
}

interface CashLedgerParams {
    efectivoInicio: number;
    totalEfectivoPagado: number;
    /** Ya en 0 para venta por peso: sus propinas no entran al cajón. */
    totalPropinaEfectivo: number;
    totalDomicilios: number;
    totalGastos: number;
    /** Aclaración bajo las ventas en efectivo (retail: ya traen apartados y devoluciones). */
    salesNote?: string;
}

/**
 * Renglones de la cuenta del efectivo en caja, en el orden en que se suman y restan.
 * Los renglones opcionales (propinas, domicilios, gastos) solo aparecen cuando su monto es mayor que 0.
 * La suma de estos renglones es `calcEfectivoCierre`.
 */
export const buildCashLedgerRows = ({
    efectivoInicio,
    totalEfectivoPagado,
    totalPropinaEfectivo,
    totalDomicilios,
    totalGastos,
    salesNote,
}: CashLedgerParams): IReceiptRow[] => {
    const rows: IReceiptRow[] = [
        { key: "initial", label: "Efectivo inicial", amount: efectivoInicio, sign: "none" },
        { key: "cash-sales", label: "Ventas en efectivo", note: salesNote, amount: totalEfectivoPagado, sign: "plus" },
    ];

    if (totalPropinaEfectivo > 0) {
        rows.push({ key: "cash-tips", label: "Propinas en efectivo", amount: totalPropinaEfectivo, sign: "plus" });
    }

    if (totalGastos > 0) {
        rows.push({
            key: "expenses",
            label: "Gastos extra",
            note: "Compras del turno pagadas en efectivo",
            amount: totalGastos,
            sign: "minus",
            hasDetail: true,
        });
    }

    if (totalDomicilios > 0) {
        rows.push({
            key: "delivery",
            label: "Domicilios",
            note: "Pagados en efectivo por el negocio",
            amount: totalDomicilios,
            sign: "minus",
        });
    }

    return rows;
};

/**
 * Propinas que no están en el cajón, solo informativas. Venta por peso no suma ninguna propina al efectivo,
 * así que muestra el total; en los demás negocios solo las de tarjeta o transferencia. Null si no hay nada.
 */
export const buildOutsideTipsRow = (
    sellByWeight: boolean,
    totalPropinas: number,
    totalPropinasTarjeta: number,
): IReceiptRow | null => {
    if (sellByWeight) {
        return totalPropinas > 0
            ? { key: "tips", label: "Propinas registradas", note: "No se incluyen en el efectivo en caja", amount: totalPropinas, sign: "none" }
            : null;
    }
    return totalPropinasTarjeta > 0
        ? { key: "tips", label: "Propinas por tarjeta", note: "propinas recibidas al pagar por transferencia o terminal", amount: totalPropinasTarjeta, sign: "none" }
        : null;
};

interface RetailMovementsFlags {
    hasLayaway: boolean;
    hasReturns: boolean;
}

/**
 * Qué movimientos de retail se desglosan en el recibo. Apartados y devoluciones ya están dentro de las
 * ventas por método de pago (MainOrderReportModel::totalByPaymentMethod), así que solo se explican.
 */
export const getRetailMovements = (
    isRetail: boolean,
    layawaySummary: ILayawaySummary,
    returnsSummary: IReturnsSummary,
): RetailMovementsFlags => ({
    hasLayaway: isRetail && (layawaySummary.abonos > 0 || layawaySummary.reembolsos > 0),
    hasReturns: isRetail && returnsSummary.count > 0,
});

/** Resumen de una línea del bloque plegado de apartados y devoluciones, ej. "apartados $454.80 · 4 devoluciones". */
export const buildIncludedSummary = (
    layawaySummary: ILayawaySummary,
    returnsSummary: IReturnsSummary,
    flags: RetailMovementsFlags,
): string =>
    [
        flags.hasLayaway ? `apartados ${formatCurrency(layawaySummary.neto)}` : null,
        flags.hasReturns ? `${returnsSummary.count} ${returnsSummary.count === 1 ? "devolución" : "devoluciones"}` : null,
    ]
        .filter(Boolean)
        .join(" · ");
