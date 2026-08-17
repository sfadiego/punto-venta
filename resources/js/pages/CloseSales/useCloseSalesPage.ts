import { useCloseSalesSummary } from "./useCloseSalesSummary";
import { useCloseSalesExpenses } from "./useCloseSalesExpenses";
import { useCloseSalesOrdersGuard } from "./useCloseSalesOrdersGuard";
import { useCloseSalesAction } from "./useCloseSalesAction";

export const useCloseSalesPage = () => {
    const summary = useCloseSalesSummary();
    const expenses = useCloseSalesExpenses(summary.sistemaId);
    const ordersGuard = useCloseSalesOrdersGuard(summary.sistemaId);
    const action = useCloseSalesAction(summary.sistemaId, ordersGuard.hasActiveOrders);

    return {
        ...summary,
        ...expenses,
        ...ordersGuard,
        ...action,
    };
};
