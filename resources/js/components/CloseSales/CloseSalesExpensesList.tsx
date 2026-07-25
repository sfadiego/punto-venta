import { ReceiptText } from "lucide-react";
import { IExpense } from "@/models/IExpense";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatOrderTime } from "@/utils/dateUtils";

interface CloseSalesExpensesListProps {
    expenses: IExpense[];
}

export const CloseSalesExpensesList = ({ expenses }: CloseSalesExpensesListProps) => {
    if (expenses.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-red-100 shrink-0">
                    <ReceiptText size={16} className="text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-stone-900">Gastos del turno</h3>
            </div>

            <div className="divide-y divide-stone-100">
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
        </div>
    );
};
