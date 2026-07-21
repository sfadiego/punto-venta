import { HandCoins, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useTopDebtorsWidget } from "../useTopDebtorsWidget";

export const TopDebtorsWidget = () => {
    const { debtors, isLoading, goToCustomer } = useTopDebtorsWidget();

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
                <HandCoins size={20} className="text-red-500" />
                <h2 className="text-sm font-semibold text-stone-800">Top 5 clientes con más adeudo</h2>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10">
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : debtors.length === 0 ? (
                <p className="text-sm text-stone-400 py-6 text-center">Sin clientes con adeudo registrado.</p>
            ) : (
                <div className="space-y-1">
                    {debtors.map((customer, index) => (
                        <button
                            key={customer.id}
                            onClick={() => goToCustomer(customer.id)}
                            className="w-full flex items-center justify-between gap-3 py-2.5 px-2 -mx-2 rounded-xl hover:bg-stone-50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-6 h-6 rounded-lg bg-red-50 text-red-600 text-xs font-bold flex items-center justify-center shrink-0">
                                    {index + 1}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-stone-800 truncate">{customer.name}</p>
                                    {customer.phone && (
                                        <p className="text-xs text-stone-400">{customer.phone}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-sm font-semibold text-red-600 tabular-nums">
                                    {formatCurrency(customer.balance)}
                                </span>
                                <ChevronRight size={14} className="text-stone-300" />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
