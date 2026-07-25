import { X, ReceiptText, ArrowLeft } from "lucide-react";
import { FormikProps } from "formik";
import { IExpense } from "@/models/IExpense";
import { ExpensesListView } from "./ExpensesListView";
import { ExpenseFormView } from "./ExpenseFormView";
import { ExpensesModalTab, RegisterExpenseForm } from "./useExpensesModal";

interface ExpensesModalProps {
    isOpen: boolean;
    tab: ExpensesModalTab;
    onTabChange: (tab: ExpensesModalTab) => void;
    expenses: IExpense[];
    isLoadingExpenses: boolean;
    formik: FormikProps<RegisterExpenseForm>;
    onClose: () => void;
}

export const ExpensesModal = ({
    isOpen,
    tab,
    onTabChange,
    expenses,
    isLoadingExpenses,
    formik,
    onClose,
}: ExpensesModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                        {tab === "form" ? (
                            <button
                                onClick={() => onTabChange("list")}
                                className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors"
                            >
                                <ArrowLeft size={16} className="text-red-600" />
                            </button>
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                <ReceiptText size={16} className="text-red-600" />
                            </div>
                        )}
                        <h2 className="font-semibold text-stone-900 text-sm">
                            {tab === "list" ? "Gastos del día" : "Registrar gasto"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {tab === "list" ? (
                    <ExpensesListView
                        expenses={expenses}
                        isLoading={isLoadingExpenses}
                        onAddNew={() => onTabChange("form")}
                    />
                ) : (
                    <ExpenseFormView formik={formik} onCancel={() => onTabChange("list")} />
                )}
            </div>
        </div>
    );
};
