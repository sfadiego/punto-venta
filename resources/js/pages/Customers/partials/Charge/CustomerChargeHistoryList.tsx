import { ICustomerCharge } from "@/models/ICustomer";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { formatOrderTime } from "@/utils/dateUtils";

interface CustomerChargeHistoryListProps {
    charges?: ICustomerCharge[];
}

export const CustomerChargeHistoryList = ({ charges }: CustomerChargeHistoryListProps) => (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-stone-900 mb-3">Cargos registrados</h2>
        {!charges || charges.length === 0 ? (
            <p className="text-sm text-stone-400">Sin cargos registrados.</p>
        ) : (
            <div className="space-y-2">
                {charges.map((charge) => (
                    <div key={charge.id} className="flex items-center justify-between text-sm py-1.5 border-b border-stone-50 last:border-0">
                        <div className="min-w-0">
                            <p className="text-stone-700">{formatOrderTime(charge.created_at)}</p>
                            {charge.note && <p className="text-xs text-stone-400 truncate">{charge.note}</p>}
                        </div>
                        <span className="font-semibold text-red-600 tabular-nums shrink-0 ml-2">
                            {formatCurrencyTrimmed(Number(charge.amount))}
                        </span>
                    </div>
                ))}
            </div>
        )}
    </div>
);
