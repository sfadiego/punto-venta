import { ICustomerPayment } from "@/models/ICustomer";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatOrderTime } from "@/utils/dateUtils";

interface CustomerPaymentHistoryListProps {
    payments?: ICustomerPayment[];
}

export const CustomerPaymentHistoryList = ({ payments }: CustomerPaymentHistoryListProps) => (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-stone-900 mb-3">Historial de pagos</h2>
        {!payments || payments.length === 0 ? (
            <p className="text-sm text-stone-400">Sin pagos registrados.</p>
        ) : (
            <div className="space-y-2">
                {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between text-sm py-1.5 border-b border-stone-50 last:border-0">
                        <div className="min-w-0">
                            <p className="text-stone-700">{formatOrderTime(payment.created_at)}</p>
                            {payment.note && <p className="text-xs text-stone-400 truncate">{payment.note}</p>}
                        </div>
                        <span className="font-semibold text-green-600 tabular-nums shrink-0 ml-2">
                            {formatCurrency(Number(payment.amount))}
                        </span>
                    </div>
                ))}
            </div>
        )}
    </div>
);
