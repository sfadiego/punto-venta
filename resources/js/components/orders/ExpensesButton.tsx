import { ReceiptText } from "lucide-react";
import { useAxios } from "@/hooks/useAxios";
import { ExpensesModal } from "./ExpensesModal/ExpensesModal";
import { useExpensesModal } from "./ExpensesModal/useExpensesModal";

interface ExpensesButtonProps {
    className?: string;
}

export const ExpensesButton = ({ className }: ExpensesButtonProps) => {
    const { sistemaId } = useAxios();
    const {
        isOpen, openModal, handleClose, tab, setTab, expenses, isLoadingExpenses, formik,
    } = useExpensesModal(sistemaId ?? null);

    return (
        <>
            <button
                onClick={openModal}
                className={className ?? "flex items-center gap-2 bg-stone-100 hover:bg-red-100 text-stone-600 hover:text-red-600 font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"}
            >
                <ReceiptText size={16} />
                Gastos
            </button>

            <ExpensesModal
                isOpen={isOpen}
                tab={tab}
                onTabChange={setTab}
                expenses={expenses}
                isLoadingExpenses={isLoadingExpenses}
                formik={formik}
                onClose={handleClose}
            />
        </>
    );
};
