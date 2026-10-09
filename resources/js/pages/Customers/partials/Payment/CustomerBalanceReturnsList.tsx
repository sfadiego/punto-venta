import { Undo2 } from "lucide-react";
import { RETURN_REASON_LABELS } from "@/enums/ReturnReasonEnum";
import { ICustomerBalanceReturn } from "@/models/ICustomer";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { formatOrderDateTime } from "@/utils/dateUtils";

interface CustomerBalanceReturnsListProps {
    returns?: ICustomerBalanceReturn[];
}

// Devoluciones de ventas a crédito que bajaron el adeudo del cliente. No son abonos (no cuentan como
// "último abono"), por eso van en su propia lista. Sin devoluciones no se muestra nada.
export const CustomerBalanceReturnsList = ({ returns }: CustomerBalanceReturnsListProps) => {
    if (!returns || returns.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-stone-900 mb-3">
                <Undo2 size={14} className="text-stone-400" />
                Devoluciones aplicadas al adeudo
            </h2>
            <div className="space-y-2">
                {returns.map((orderReturn) => (
                    <div key={orderReturn.id} className="flex items-center justify-between text-sm py-1.5 border-b border-stone-50 last:border-0">
                        <div className="min-w-0">
                            <p className="text-stone-700">{formatOrderDateTime(orderReturn.created_at)}</p>
                            <p className="text-xs text-stone-400 truncate">
                                Venta #{orderReturn.order_id} · {RETURN_REASON_LABELS[orderReturn.reason]}
                            </p>
                        </div>
                        <span className="font-semibold text-green-600 tabular-nums shrink-0 ml-2">
                            -{formatCurrencyTrimmed(Number(orderReturn.balance_applied))}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
