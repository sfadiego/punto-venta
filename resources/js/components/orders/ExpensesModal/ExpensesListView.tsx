import { Loader, ReceiptText, PackagePlus } from "lucide-react";
import { IExpense } from "@/models/IExpense";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatOrderTime } from "@/utils/dateUtils";

interface ExpensesListViewProps {
    expenses: IExpense[];
    isLoading: boolean;
    onAddNew: () => void;
}

export const ExpensesListView = ({ expenses, isLoading, onAddNew }: ExpensesListViewProps) => {
    const total = expenses.reduce((sum, expense) => sum + Number(expense.monto), 0);

    return (
        <div className="p-5">
            {isLoading ? (
                <div className="flex items-center justify-center py-10">
                    <Loader size={20} className="animate-spin text-stone-400" />
                </div>
            ) : expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                        <ReceiptText size={18} className="text-stone-300" />
                    </div>
                    <p className="text-sm text-stone-400">Aún no hay gastos registrados hoy.</p>
                </div>
            ) : (
                <>
                    <div className="max-h-72 overflow-y-auto divide-y divide-stone-100 -mx-1 px-1">
                        {expenses.map((expense) => (
                            <div key={expense.id} className="flex items-start justify-between gap-3 py-2.5">
                                <div className="min-w-0">
                                    <p className="text-sm text-stone-800 font-medium truncate">{expense.concepto}</p>
                                    <p className="text-xs text-stone-400 mt-0.5">
                                        {expense.user?.nombre ?? "—"} · {formatOrderTime(expense.created_at)}
                                    </p>
                                    {expense.observaciones && (
                                        <p className="text-xs text-stone-500 mt-0.5">{expense.observaciones}</p>
                                    )}
                                </div>
                                <p className="text-sm font-semibold text-red-600 whitespace-nowrap">
                                    -{formatCurrency(expense.monto)}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-100">
                        <p className="text-xs text-stone-500 font-medium">Total del día</p>
                        <p className="text-sm font-bold text-red-600">-{formatCurrency(total)}</p>
                    </div>
                </>
            )}

            <button
                onClick={onAddNew}
                className="w-full mt-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
                <PackagePlus size={14} />
                Agregar gasto
            </button>
        </div>
    );
};
