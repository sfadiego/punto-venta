import { useCloseSalesSummary } from "./useCloseSalesSummary";
import { useCloseSalesExpenses } from "./useCloseSalesExpenses";
import { useCloseSalesOrdersGuard } from "./useCloseSalesOrdersGuard";
import { useCloseSalesAction } from "./useCloseSalesAction";
import { useCloseSalesEmptyReason } from "./useCloseSalesEmptyReason";

export const useCloseSalesPage = () => {
    const summary = useCloseSalesSummary();
    const expenses = useCloseSalesExpenses(summary.sistemaId);
    const ordersGuard = useCloseSalesOrdersGuard(summary.sistemaId);
    const action = useCloseSalesAction(summary.sistemaId, ordersGuard.hasActiveOrders);
    const emptyReason = useCloseSalesEmptyReason();

    return {
        ...summary,
        ...expenses,
        ...ordersGuard,
        ...action,
        emptyReasonFormik: emptyReason.formik,
        // Una sesión sin ventas solo se puede cerrar con un motivo válido.
        canClose: !ordersGuard.hasActiveOrders && (!summary.isEmptySession || emptyReason.isValid),
        handleClose: () => action.handleClose(summary.isEmptySession ? emptyReason.reason : undefined),
    };
};
