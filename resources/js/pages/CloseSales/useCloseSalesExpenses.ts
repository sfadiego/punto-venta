import { useState } from "react";
import { useIndexExpenses } from "@/services/useExpenseService";

export const useCloseSalesExpenses = (sistemaId: number | null) => {
    const { data: expenses } = useIndexExpenses(sistemaId);

    const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
    const openExpensesModal = () => setIsExpensesModalOpen(true);
    const closeExpensesModal = () => setIsExpensesModalOpen(false);

    return {
        expenses: expenses ?? [],
        isExpensesModalOpen,
        openExpensesModal,
        closeExpensesModal,
    };
};
