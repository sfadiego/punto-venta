import { useMemo } from "react";
import { useAxios } from "@/hooks/useAxios";
import { useCashOnHand } from "@/hooks/useCashOnHand";
import { useIndexPaymentMethods } from "@/services/usePaymentMethodService";
import { IOrder } from "@/models/IOrder";
import { IOrderProduct } from "@/models/IOrderProduct";
import { IOrderReturnForm } from "@/models/IOrderReturnForm";
import { isCashMethodName } from "@/utils/paymentMethods";
import { calcReturnRefund } from "@/utils/returnRefundCalc";

export type ReturnRefundState = ReturnType<typeof useReturnRefund>;

interface UseReturnRefundParams {
    order: IOrder | null;
    lines: IOrderProduct[];
    values: IOrderReturnForm;
}

// Lo que implica devolver dinero con las líneas marcadas: cuánto se devuelve, cuánto baja el saldo del
// cliente y cuánto sale de la caja, con los avisos que impiden o advierten del movimiento (sin caja
// abierta, efectivo insuficiente).
export const useReturnRefund = ({ order, lines, values }: UseReturnRefundParams) => {
    const { sistemaId } = useAxios();
    const { data: paymentMethods = [] } = useIndexPaymentMethods();
    const { cashOnHand } = useCashOnHand();

    const estimate = useMemo(
        () => (order ? calcReturnRefund(order, lines, values.items) : { total: 0, balanceApplied: 0, methodAmount: 0 }),
        [order, lines, values.items],
    );

    const needsMethod = values.refund && estimate.methodAmount > 0;
    const selectedMethod = paymentMethods.find((method) => method.id === values.payment_method_id);
    const isCashRefund = needsMethod && !!selectedMethod && isCashMethodName(selectedMethod.name);

    return {
        estimate,
        paymentMethods,
        needsMethod,
        cashOnHand,
        // Para devolver dinero por un método hace falta una caja abierta de donde salga.
        hasNoOpenCash: needsMethod && !sistemaId,
        hasCashShortage: isCashRefund && cashOnHand !== null && estimate.methodAmount > cashOnHand,
    };
};
