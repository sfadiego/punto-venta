import { X, ReceiptText } from "lucide-react";
import { IExpense } from "@/models/IExpense";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatOrderTime } from "@/utils/dateUtils";

interface CloseSalesExpensesModalProps {
    isOpen: boolean;
    expenses: IExpense[];
    onClose: () => void;
}

export const CloseSalesExpensesModal = ({ isOpen, expenses, onClose }: CloseSalesExpensesModalProps) => {
    if (!isOpen) return null;

    const total = expenses.reduce((sum, expense) => sum + Number(expense.monto), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                            <ReceiptText size={16} className="text-red-600" />
                        </div>
                        <h2 className="font-semibold text-stone-900 text-sm">Gastos del turno</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5">
                    {expenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                                <ReceiptText size={18} className="text-stone-300" />
                            </div>
                            <p className="text-sm text-stone-400">No hay gastos registrados en este turno.</p>
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
                                <p className="text-xs text-stone-500 font-medium">Total del turno</p>
                                <p className="text-sm font-bold text-red-600">-{formatCurrency(total)}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
