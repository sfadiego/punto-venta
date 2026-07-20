import { Lock, LockOpen } from "lucide-react";
import { ICustomerDetail } from "@/models/ICustomer";
import { formatCurrency } from "@/utils/formatCurrency";

interface CustomerBalanceCardProps {
    customer: ICustomerDetail;
    onToggleCredit: () => void;
    isTogglingCredit: boolean;
}

export const CustomerBalanceCard = ({ customer, onToggleCredit, isTogglingCredit }: CustomerBalanceCardProps) => {
    const balance = Number(customer.balance);

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 mb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">Adeudo actual</p>
                    <p className={`text-3xl font-bold tabular-nums mt-1 ${balance > 0 ? "text-red-600" : "text-stone-800"}`}>
                        {formatCurrency(balance)}
                    </p>
                </div>
                <button
                    onClick={onToggleCredit}
                    disabled={isTogglingCredit}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                        customer.allow_credit
                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                            : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                    }`}
                >
                    {customer.allow_credit ? <LockOpen size={16} /> : <Lock size={16} />}
                    {customer.allow_credit ? "Crédito habilitado" : "Crédito revocado"}
                </button>
            </div>
            {customer.notes && (
                <p className="text-sm text-stone-500 mt-4 pt-4 border-t border-stone-100">{customer.notes}</p>
            )}
        </div>
    );
};
