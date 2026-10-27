import { ChevronDown } from "lucide-react";
import { ILayawaySummary, IReturnsSummary } from "@/services/useOpenSalesService";
import { buildIncludedSummary } from "@/utils/closeSalesReceipt";
import { CloseSalesReceiptIncludedGroup } from "./CloseSalesReceiptIncludedGroup";
import { CloseSalesReceiptIncludedRow } from "./CloseSalesReceiptIncludedRow";

interface CloseSalesReceiptIncludedProps {
    layawaySummary: ILayawaySummary;
    returnsSummary: IReturnsSummary;
    hasLayaway: boolean;
    hasReturns: boolean;
}

// Desglose de apartados y devoluciones de la sesión. Ya están dentro de las ventas por método de pago,
// por eso va plegado y sin signos ni rojo: solo explica, no se suma ni se resta otra vez.
export const CloseSalesReceiptIncluded = ({
    layawaySummary,
    returnsSummary,
    hasLayaway,
    hasReturns,
}: CloseSalesReceiptIncludedProps) => (
    <details className="group mt-5 rounded-xl border border-stone-200 text-sm text-stone-500">
        <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-x-3 gap-y-0.5 px-4 py-2.5 [&::-webkit-details-marker]:hidden">
            <span>
                <span className="font-semibold text-stone-800">Apartados y devoluciones</span> · desglose
            </span>
            <span className="flex items-center gap-1.5">
                <span className="font-mono tabular-nums">{buildIncludedSummary(layawaySummary, returnsSummary, { hasLayaway, hasReturns })}</span>
                <ChevronDown size={16} className="shrink-0 text-stone-400 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
            </span>
        </summary>

        <ul className="space-y-1 px-4 pb-3">
            {hasLayaway && (
                <>
                    <CloseSalesReceiptIncludedGroup title="Apartados · neto" amount={layawaySummary.neto} />
                    <CloseSalesReceiptIncludedRow label="Abonos recibidos" amount={layawaySummary.abonos} />
                    <CloseSalesReceiptIncludedRow label="Reembolsos" amount={layawaySummary.reembolsos} />
                </>
            )}
            {hasReturns && (
                <>
                    <CloseSalesReceiptIncludedGroup title={`Devoluciones · ${returnsSummary.count}`} amount={returnsSummary.total} />
                    <CloseSalesReceiptIncludedRow label="Devuelto al cliente" amount={returnsSummary.cash_out} />
                    {returnsSummary.balance_applied > 0 && (
                        <CloseSalesReceiptIncludedRow label="Saldo de clientes a crédito" amount={returnsSummary.balance_applied} />
                    )}
                </>
            )}
        </ul>
    </details>
);
