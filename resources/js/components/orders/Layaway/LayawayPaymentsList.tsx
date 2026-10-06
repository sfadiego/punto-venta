import { ILayawayPayment } from "@/models/ILayaway";
import { LayawayPaymentTypeEnum } from "@/enums/LayawayPaymentTypeEnum";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { formatOrderDateTime } from "@/utils/dateUtils";

interface LayawayPaymentsListProps {
    payments: ILayawayPayment[];
}

// Historial de movimientos de un apartado: abonos (suman) y reembolsos por cancelación (restan).
export const LayawayPaymentsList = ({ payments }: LayawayPaymentsListProps) => {
    if (payments.length === 0) {
        return <p className="text-xs text-stone-400">Sin abonos registrados.</p>;
    }

    return (
        <div className="divide-y divide-stone-100">
            {payments.map((payment) => {
                const isRefund = payment.type === LayawayPaymentTypeEnum.Refund;
                return (
                    <div key={payment.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <div className="min-w-0">
                            <p className="text-stone-700">{isRefund ? "Reembolso" : "Abono"}</p>
                            <p className="text-xs text-stone-400 truncate">
                                {formatOrderDateTime(payment.created_at)}
                                {payment.payment_method?.name && ` · ${payment.payment_method.name}`}
                            </p>
                        </div>
                        <span
                            className={`font-semibold tabular-nums shrink-0 ${isRefund ? "text-red-500" : "text-emerald-600"}`}
                        >
                            {isRefund ? "-" : "+"} {formatCurrencyTrimmed(Number(payment.amount))}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
