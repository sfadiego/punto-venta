import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useModal } from "@/hooks/useModal";
import { invalidateOrderPaymentQueries, useUpdateOrder } from "@/services/useOrderService";
import { useCashDrawer } from "@/components/orders/PrintTicket/useCashDrawer";
import { useAxios } from "@/hooks/useAxios";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { calcCostoDomicilio } from "@/utils/deliveryCalc";
import { canPayOrder, resolveDefaultPaymentMethodId } from "@/utils/paymentMethods";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { usePaymentSelection } from "./usePaymentSelection";
import { useCreditSelection } from "./useCreditSelection";

interface DeliveryInfo {
    domicilio: number;
    domicilioActivo: boolean;
    customerPays: boolean;
}

// Orquesta el modal de cobro: compone usePaymentSelection (efectivo/propina/método) y
// useCreditSelection (venta a crédito), y agrega la lógica que cruza ambos dominios
// (mutua exclusión método-vs-crédito, canPay, reset al abrir) más el cobro en sí.
// flushPending: envía los toques del carrito que aún no llegan al servidor. Se espera antes de
// abrir el cobro: cerrar la orden sin esos productos los perdería (el backend rechaza agregar
// a una orden cerrada). Devuelve false si algún envío falló.
export const usePayModal = (
    orderId: number,
    total: number,
    delivery: DeliveryInfo,
    flushPending: () => Promise<boolean>,
) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { sistemaId } = useAxios();
    const { isOpen, openModal, closeModal } = useModal();
    const paymentSelection = usePaymentSelection(total);
    const creditSelection = useCreditSelection();

    const { mutateAsync: updateOrder, isPending } = useUpdateOrder(orderId);
    const { openCashDrawer } = useCashDrawer();

    const canPay = canPayOrder({
        isCreditMode: creditSelection.isCreditMode,
        isCash: paymentSelection.isCash,
        total,
        cashNum: paymentSelection.cashNum,
        selectedCustomer: creditSelection.selectedCustomer,
    });

    const handleOpen = async () => {
        if (!(await flushPending())) return;
        paymentSelection.setCash("");
        paymentSelection.setPropina("");
        paymentSelection.setPaymentMethodId(resolveDefaultPaymentMethodId(paymentSelection.paymentMethods));
        creditSelection.setIsCreditMode(false);
        creditSelection.setSelectedCustomerId(null);
        openModal();
    };

    const handleSelectCredit = () => {
        creditSelection.setIsCreditMode(true);
        paymentSelection.setPaymentMethodId(null);
    };

    const handleSelectMethod = (id: number) => {
        creditSelection.setIsCreditMode(false);
        paymentSelection.setPaymentMethodId(id);
    };

    const handlePay = async () => {
        const propinaNum = parseFloat(paymentSelection.propina) || 0;
        const paymentData = creditSelection.isCreditMode
            ? { is_credit: true, customer_id: creditSelection.selectedCustomerId }
            : { payment_method_id: paymentSelection.paymentMethodId, propina: propinaNum > 0 ? propinaNum : 0 };
        try {
            await updateOrder({
                estatus_pedido_id: OrderStatusEnum.Closed,
                costo_domicilio: delivery.domicilioActivo
                    ? calcCostoDomicilio(delivery.domicilio, delivery.domicilioActivo, delivery.customerPays)
                    : 0,
                ...paymentData,
            });
            invalidateOrderPaymentQueries(queryClient, {
                orderId,
                sistemaId,
                customerId: creditSelection.isCreditMode ? creditSelection.selectedCustomerId : null,
            });
            toast.success(creditSelection.isCreditMode ? "Venta a crédito registrada correctamente" : "Orden cerrada exitosamente");
            if (paymentSelection.isCash && !creditSelection.isCreditMode) void openCashDrawer();
            closeModal();
            navigate("/");
        } catch (error) {
            logUnexpectedError(error, "usePayModal.handlePay");
            toast.error(getUserFacingErrorMessage(error, "Error al cerrar la orden"));
        }
    };

    return {
        isOpen,
        ...paymentSelection,
        ...creditSelection,
        canPay,
        isPending,
        handleOpen,
        handleClose: closeModal,
        handlePay,
        handleSelectCredit,
        handleSelectMethod,
    };
};
