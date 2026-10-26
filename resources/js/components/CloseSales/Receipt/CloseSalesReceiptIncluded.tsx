import { ILayawaySummary, IReturnsSummary } from "@/services/useOpenSalesService";
import { formatCurrency } from "@/utils/formatCurrency";
import { CloseSalesReceiptGroup } from "./CloseSalesReceiptGroup";
import { CloseSalesReceiptRow } from "./CloseSalesReceiptRow";

interface CloseSalesReceiptIncludedProps {
    layawaySummary: ILayawaySummary;
    returnsSummary: IReturnsSummary;
    hasLayaway: boolean;
    hasReturns: boolean;
}

// Desglose de apartados y devoluciones de la sesión. Ya están dentro de las ventas por método de pago,
// por eso va aparte de la cuenta del efectivo: solo explica, no suma ni resta otra vez.
export const CloseSalesReceiptIncluded = ({
    layawaySummary,
    returnsSummary,
    hasLayaway,
    hasReturns,
}: CloseSalesReceiptIncludedProps) => (
    <div className="mt-5 rounded-xl border border-dashed border-stone-300 px-4 pb-2 pt-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Ya incluido en las ventas</h2>
        <p className="text-xs text-stone-500 mt-0.5">Estos movimientos no se suman ni se restan otra vez.</p>

        <ul className="[&>li:last-child]:border-b-0">
            {hasLayaway && (
                <>
                    <CloseSalesReceiptGroup title={`Apartados · neto ${formatCurrency(layawaySummary.neto)}`} />
                    <CloseSalesReceiptRow label="Abonos recibidos" amount={layawaySummary.abonos} sign="plus" />
                    <CloseSalesReceiptRow label="Reembolsos" amount={layawaySummary.reembolsos} sign="minus" />
                </>
            )}
            {hasReturns && (
                <>
                    <CloseSalesReceiptGroup title={`Devoluciones · ${returnsSummary.count}`} />
                    <CloseSalesReceiptRow label="Devuelto al cliente" amount={returnsSummary.cash_out} sign="minus" />
                    {returnsSummary.balance_applied > 0 && (
                        <CloseSalesReceiptRow
                            label="Saldo de clientes a crédito"
                            amount={returnsSummary.balance_applied}
                            sign="minus"
                        />
                    )}
                </>
            )}
        </ul>
    </div>
);
