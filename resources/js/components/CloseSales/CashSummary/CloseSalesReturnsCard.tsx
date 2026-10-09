import { Undo2 } from "lucide-react";
import { IReturnsSummary } from "@/services/useOpenSalesService";
import { formatCurrency } from "@/utils/formatCurrency";

interface CloseSalesReturnsCardProps {
    returnsSummary: IReturnsSummary;
}

// Devoluciones reembolsadas en la sesión: lo que salió de la caja por método de pago y lo que solo bajó
// el saldo de clientes a crédito. El total ya está descontado de las ventas del día — aquí solo se desglosa.
export const CloseSalesReturnsCard = ({ returnsSummary }: CloseSalesReturnsCardProps) => (
    <div className="sm:col-span-2 bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-start gap-4 sm:flex-1 min-w-0">
                <div className="p-2.5 rounded-xl shrink-0 bg-red-100">
                    <Undo2 size={20} className="text-red-500" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-stone-500 font-medium">
                        Devoluciones ({returnsSummary.count})
                    </p>
                    <p className="text-xl font-bold text-red-500 mt-0.5 tabular-nums">-{formatCurrency(returnsSummary.total)}</p>
                </div>
            </div>

            <dl className="sm:w-80 shrink-0 rounded-xl bg-stone-50 border border-stone-100 px-4 py-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                    <dt className="text-stone-500 whitespace-nowrap">Devuelto al cliente</dt>
                    <dd className="font-semibold text-red-500 tabular-nums whitespace-nowrap">- {formatCurrency(returnsSummary.cash_out)}</dd>
                </div>
                {returnsSummary.balance_applied > 0 && (
                    <div className="flex items-center justify-between gap-3">
                        <dt className="text-stone-500 whitespace-nowrap">Saldo de clientes a crédito</dt>
                        <dd className="font-semibold text-stone-700 tabular-nums whitespace-nowrap">- {formatCurrency(returnsSummary.balance_applied)}</dd>
                    </div>
                )}
            </dl>
        </div>
    </div>
);
