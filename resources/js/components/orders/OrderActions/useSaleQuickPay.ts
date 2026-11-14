import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { invalidateOrderPaymentQueries, useUpdateOrder } from "@/services/useOrderService";
import { useIndexPaymentMethods } from "@/services/usePaymentMethodService";
import { useCustomerList } from "@/services/useCustomerService";
import { useCashDrawer } from "@/components/orders/PrintTicket/useCashDrawer";
import { useAxios } from "@/hooks/useAxios";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { IOrder } from "@/models/IOrder";
import { resolveDefaultPaymentMethodId, canPayOrder } from "@/utils/paymentMethods";

export const useSaleQuickPay = (order: IOrder) => {
    const queryClient = useQueryClient();
    const { sistemaId } = useAxios();
    const [isOpen, setIsOpen] = useState(false);
    const [cash, setCash] = useState("");
    const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
    const [isCreditMode, setIsCreditMode] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

    const { mutateAsync: updateOrder, isPending: isPaying } = useUpdateOrder(order.id);
    const { data: paymentMethods = [] } = useIndexPaymentMethods();
    const { data: customers = [] } = useCustomerList();
    const { openCashDrawer } = useCashDrawer();

    const totalFinal = order.total;
    const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId) ?? null;
    const isCashMethod = !selectedMethod || selectedMethod.name.toLowerCase().includes("efectivo");
    const cashNum = parseFloat(cash) || 0;
    const change = cashNum - totalFinal;
    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;
    const canPay = canPayOrder({ isCreditMode, isCash: isCashMethod, total: totalFinal, cashNum, selectedCustomer });

    const openPayModal = () => {
        setCash("");
        setIsCreditMode(false);
        setSelectedCustomerId(null);
        setPaymentMethodId(resolveDefaultPaymentMethodId(paymentMethods));
        setIsOpen(true);
    };

    const closePayModal = () => setIsOpen(false);

    const handlePay = async () => {
        try {
            const paymentData = isCreditMode
                ? { is_credit: true, customer_id: selectedCustomerId }
                : { payment_method_id: paymentMethodId };

            await updateOrder({
                estatus_pedido_id: OrderStatusEnum.Closed,
                ...paymentData,
            });
            invalidateOrderPaymentQueries(queryClient, {
                orderId: order.id,
                sistemaId,
                customerId: isCreditMode ? selectedCustomerId : null,
            });
            toast.success(isCreditMode ? "Venta a crédito registrada correctamente" : "Orden cerrada exitosamente");
            if (isCashMethod && !isCreditMode) void openCashDrawer();
            closePayModal();
        } catch (error) {
            logUnexpectedError(error, "useSaleQuickPay.handlePay");
            toast.error(getUserFacingErrorMessage(error, "Error al cerrar la orden"));
        }
    };

    return {
        isOpen,
        totalFinal,
        cash,
        setCash,
        cashNum,
        change,
        canPay,
        isPaying,
        paymentMethods,
        paymentMethodId,
        setPaymentMethodId,
        isCashMethod,
        isCreditMode,
        setIsCreditMode,
        customers,
        selectedCustomerId,
        setSelectedCustomerId,
        openPayModal,
        closePayModal,
        handlePay,
    };
};
