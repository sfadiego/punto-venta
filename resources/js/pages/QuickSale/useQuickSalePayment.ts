import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NavigateFunction } from "react-router-dom";
import { toast } from "react-toastify";
import { useCashDrawer } from "@/components/orders/PrintTicket/useCashDrawer";
import { invalidateOrderPaymentQueries, useStoreOrderSale, useUpdateOrderData } from "@/services/useOrderService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { resolveSaleName } from "@/utils/resolveSaleName";
import { canPayOrder } from "@/utils/paymentMethods";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { IOrder } from "@/models/IOrder";
import { IModalCartItem } from "@/models/IModalCartItem";
import { buildOrderItems } from "@/utils/sellByWeightCartCalc";
import { usePaymentMethod } from "./usePaymentMethod";
import { useCreditPayment } from "./useCreditPayment";

interface UseQuickSalePaymentParams {
    resumeOrderId: number | null;
    sistemaId: number | null;
    cart: IModalCartItem[];
    total: number;
    hasAnything: boolean;
    domicilioExcedeTotal: boolean;
    deliveryPayload: { is_delivery: boolean; costo_domicilio: number };
    nombrePedido: string;
    persistCart: () => Promise<number>;
    resetAfterSuccess: () => void;
    navigate: NavigateFunction;
}

// Cobro: efectivo / transferencia / crédito. El método de pago/efectivo y el modo de crédito
// viven en sus propios sub-hooks (usePaymentMethod, useCreditPayment); este hook orquesta el
// modal y el pago en sí.
export const useQuickSalePayment = ({
    resumeOrderId,
    sistemaId,
    cart,
    total,
    hasAnything,
    domicilioExcedeTotal,
    deliveryPayload,
    nombrePedido,
    persistCart,
    resetAfterSuccess,
    navigate,
}: UseQuickSalePaymentParams) => {
    const queryClient = useQueryClient();
    const { mutateAsync: updateOrderData } = useUpdateOrderData();
    const { mutateAsync: storeOrderSale } = useStoreOrderSale();
    const { openCashDrawer } = useCashDrawer();
    const paymentMethod = usePaymentMethod(total);
    const creditPayment = useCreditPayment();

    const [showPayModal, setShowPayModal] = useState(false);
    const [isPaying, setIsPaying] = useState(false);

    const hasProducts = cart.length > 0;
    const canPay =
        hasProducts &&
        !domicilioExcedeTotal &&
        canPayOrder({
            isCreditMode: creditPayment.isCreditMode,
            isCash: paymentMethod.isCashMethod,
            total,
            cashNum: paymentMethod.cashNum,
            selectedCustomer: creditPayment.selectedCustomer,
        });

    const openPayModal = () => {
        if (!sistemaId) {
            toast.error("No hay una caja abierta.");
            return;
        }
        if (!hasAnything || !hasProducts) return;
        setShowPayModal(true);
    };

    const handlePay = async () => {
        if (!sistemaId || !canPay) return;
        setIsPaying(true);
        try {
            let orderId: number;

            if (resumeOrderId) {
                // Los cambios del carrito solo viven en memoria hasta aquí: se guardan antes de
                // cerrar la orden con los datos de pago.
                orderId = await persistCart();
            } else {
                const res = await storeOrderSale({
                    sistema_id: sistemaId,
                    nombre_pedido: resolveSaleName(nombrePedido),
                    costo_domicilio: deliveryPayload.costo_domicilio,
                    items: buildOrderItems(cart),
                });
                orderId = (res as { data: { data: IOrder } }).data.data.id;
            }

            const paymentData = creditPayment.isCreditMode
                ? { is_credit: true, customer_id: creditPayment.selectedCustomerId }
                : { payment_method_id: paymentMethod.paymentMethodId };

            await updateOrderData({
                orderId,
                data: {
                    is_delivery: deliveryPayload.is_delivery,
                    // Al retomar, storeOrderSale no corrió — hay que cerrar la orden y fijar
                    // nombre/costo de envío aquí, ya que pudieron editarse en esta sesión.
                    ...(resumeOrderId
                        ? {
                              nombre_pedido: resolveSaleName(nombrePedido),
                              estatus_pedido_id: OrderStatusEnum.Closed,
                              costo_domicilio: deliveryPayload.costo_domicilio,
                          }
                        : {}),
                    ...paymentData,
                },
            });
            invalidateOrderPaymentQueries(queryClient, {
                orderId,
                sistemaId,
                customerId: creditPayment.isCreditMode ? creditPayment.selectedCustomerId : null,
            });

            toast.success(creditPayment.isCreditMode ? "Venta a crédito registrada correctamente." : "Venta registrada correctamente.");
            if (paymentMethod.isCashMethod && !creditPayment.isCreditMode) void openCashDrawer();
            setShowPayModal(false);
            resetAfterSuccess();
            paymentMethod.setCash("");
            paymentMethod.setPaymentMethodId(null);
            creditPayment.setIsCreditMode(false);
            creditPayment.setSelectedCustomerId(null);

            if (resumeOrderId) navigate(AdminRoutes.Dashboard);
        } catch (error) {
            logUnexpectedError(error, "useQuickSalePayment.handlePay");
            toast.error(getUserFacingErrorMessage(error, "Error al registrar la venta."));
        } finally {
            setIsPaying(false);
        }
    };

    return {
        ...paymentMethod,
        ...creditPayment,
        openPayModal,
        showPayModal,
        setShowPayModal,
        canPay,
        isPaying,
        handlePay,
    };
};
