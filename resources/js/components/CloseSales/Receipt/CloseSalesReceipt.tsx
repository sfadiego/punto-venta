import { IMainOrderReport } from "@/models/IMainOrderReport";
import { ILayawaySummary, IReturnsSummary } from "@/services/useOpenSalesService";
import { formatCurrency } from "@/utils/formatCurrency";
import { buildCashLedgerRows, buildOutsideTipsRow, getRetailMovements } from "@/utils/closeSalesReceipt";
import { CloseSalesReceiptHeader } from "./CloseSalesReceiptHeader";
import { CloseSalesReceiptGroup } from "./CloseSalesReceiptGroup";
import { CloseSalesReceiptRow } from "./CloseSalesReceiptRow";
import { CloseSalesReceiptIncluded } from "./CloseSalesReceiptIncluded";

interface CloseSalesReceiptProps {
    activeSale: IMainOrderReport;
    efectivoInicio: number;
    totalEfectivoPagado: number;
    /** Ya en 0 para venta por peso. */
    totalPropinaEfectivo: number;
    totalDomicilios: number;
    totalGastos: number;
    efectivoCierre: number;
    totalTransferenciaPagado: number;
    totalPropinas: number;
    totalPropinasTarjeta: number;
    totalNeto: number;
    sellByWeight: boolean;
    isRetail: boolean;
    layawaySummary: ILayawaySummary;
    returnsSummary: IReturnsSummary;
    onViewExpenses: () => void;
}

export const CloseSalesReceipt = ({
    activeSale,
    efectivoInicio,
    totalEfectivoPagado,
    totalPropinaEfectivo,
    totalDomicilios,
    totalGastos,
    efectivoCierre,
    totalTransferenciaPagado,
    totalPropinas,
    totalPropinasTarjeta,
    totalNeto,
    sellByWeight,
    isRetail,
    layawaySummary,
    returnsSummary,
    onViewExpenses,
}: CloseSalesReceiptProps) => {
    const { hasLayaway, hasReturns } = getRetailMovements(isRetail, layawaySummary, returnsSummary);
    const cashRows = buildCashLedgerRows({
        efectivoInicio,
        totalEfectivoPagado,
        salesNote: hasLayaway || hasReturns ? "Apartados y devoluciones" : undefined,
        totalPropinaEfectivo,
        totalDomicilios,
        totalGastos,
    });
    const tipsRow = buildOutsideTipsRow(sellByWeight, totalPropinas, totalPropinasTarjeta);

    return (
        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-6 sm:px-6 mb-6">
            <CloseSalesReceiptHeader activeSale={activeSale} />

            <ul>
                <CloseSalesReceiptGroup title="Efectivo" />
                {cashRows.map((row) => (
                    <CloseSalesReceiptRow
                        key={row.key}
                        label={row.label}
                        note={row.note}
                        amount={row.amount}
                        sign={row.sign}
                        onViewDetail={row.hasDetail ? onViewExpenses : undefined}
                    />
                ))}
                <CloseSalesReceiptRow label="Efectivo en caja" amount={efectivoCierre} variant="subtotal" />

                <CloseSalesReceiptGroup title="Transferencia o Terminal" />
                <CloseSalesReceiptRow label="Transferencias" amount={totalTransferenciaPagado} />
                {tipsRow && (
                    <CloseSalesReceiptRow label={tipsRow.label} note={tipsRow.note} amount={tipsRow.amount} variant="info" />
                )}
            </ul>

            <div className="mt-5 flex flex-wrap items-baseline justify-between gap-3 rounded-xl bg-[var(--color-sidebar)] text-white px-5 py-4">
                <p className="text-sm font-medium">Ventas totales del día</p>
                <p className="font-mono tabular-nums text-2xl sm:text-3xl font-semibold">{formatCurrency(totalNeto)}</p>
            </div>

            {(hasLayaway || hasReturns) && (
                <CloseSalesReceiptIncluded
                    layawaySummary={layawaySummary}
                    returnsSummary={returnsSummary}
                    hasLayaway={hasLayaway}
                    hasReturns={hasReturns}
                />
            )}
        </section>
    );
};
