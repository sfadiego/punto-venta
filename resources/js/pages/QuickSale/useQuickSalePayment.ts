import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NavigateFunction } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { usePrintAgent } from "@/hooks/usePrintAgent";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { useStoreOrderSale, useUpdateOrderData, usePrintOrder, useFetchPrintBytes } from "@/services/useOrderService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { resolveSaleName } from "@/utils/resolveSaleName";
import { calcCostoDomicilio } from "@/utils/deliveryCalc";
import { canPayOrder } from "@/utils/paymentMethods";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { IOrder } from "@/models/IOrder";
import { IModalCartItem } from "@/models/IModalCartItem";
import { useInvalidateResumeOrderQueries } from "./useInvalidateResumeOrderQueries";
import { usePaymentMethod } from "./usePaymentMethod";
import { useCreditPayment } from "./useCreditPayment";
import { invalidateSalesByCategory } from "@/services/useSalesByCategoryService";

interface UseQuickSalePaymentParams {
    resumeOrderId: number | null;
    sistemaId: number | null;
    cart: IModalCartItem[];
    total: number;
    hasAnything: boolean;
    domicilioExcedeTotal: boolean;
    domicilioActivo: boolean;
    domicilioNum: number;
    customerPays: boolean;
    nombrePedido: string;
    resetAfterSuccess: () => void;
    navigate: NavigateFunction;
}

// Cobro: efectivo / transferencia / crédito, más la impresión de ticket al cerrar la venta
// (se pregunta solo si hay una impresora ya configurada). El método de pago/efectivo y el
// modo de crédito viven en sus propios sub-hooks (usePaymentMethod, useCreditPayment); este
// hook orquesta el modal, el pago en sí y la impresión.
export const useQuickSalePayment = ({
    resumeOrderId,
    sistemaId,
    cart,
    total,
    hasAnything,
    domicilioExcedeTotal,
    domicilioActivo,
    domicilioNum,
    customerPays,
    nombrePedido,
    resetAfterSuccess,
    navigate,
}: UseQuickSalePaymentParams) => {
    const invalidateResumeOrderQueries = useInvalidateResumeOrderQueries(resumeOrderId);
    const queryClient = useQueryClient();
    const { data: businessConfig } = useGetBusinessConfig();
    const { isConnected: agentConnected, print: agentPrint } = usePrintAgent();
    const { mutateAsync: printOrder } = usePrintOrder();
    const fetchPrintBytes = useFetchPrintBytes();
    const { mutateAsync: updateOrderData } = useUpdateOrderData();
    const { mutateAsync: storeOrderSale } = useStoreOrderSale();
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

    const printTicket = async (oid: number) => {
        try {
            if (agentConnected) {
                const bytes = await fetchPrintBytes(oid);
                await agentPrint(new Uint8Array(bytes as ArrayBuffer));
            } else {
                await printOrder(oid);
            }
            toast.success("Ticket impreso");
        } catch (error) {
            logUnexpectedError(error, "useQuickSalePayment.printTicket");
            toast.error(getUserFacingErrorMessage(error, "Error al imprimir ticket"));
        }
    };

    const handlePay = async () => {
        if (!sistemaId || !canPay) return;
        setIsPaying(true);
        try {
            let orderId: number;

            if (resumeOrderId) {
                // El carrito ya está sincronizado (cada add/remove/clear pegó al backend al
                // momento) — solo falta cerrar la orden con los datos de pago.
                orderId = resumeOrderId;
            } else {
                const res = await storeOrderSale({
                    sistema_id: sistemaId,
                    nombre_pedido: resolveSaleName(nombrePedido),
                    costo_domicilio: calcCostoDomicilio(domicilioNum, domicilioActivo, customerPays),
                    items: cart.map((item) => ({
                        producto_id: item.productId,
                        variant_id: item.variantId ?? null,
                        cantidad: item.cantidad,
                    })),
                });
                orderId = (res as { data: { data: IOrder } }).data.data.id;
            }

            const paymentData = creditPayment.isCreditMode
                ? { is_credit: true, customer_id: creditPayment.selectedCustomerId }
                : { payment_method_id: paymentMethod.paymentMethodId };

            await updateOrderData({
                orderId,
                data: {
                    is_delivery: domicilioActivo,
                    // Al retomar, storeOrderSale no corrió — hay que cerrar la orden y fijar
                    // nombre/costo de envío aquí, ya que pudieron editarse en esta sesión.
                    ...(resumeOrderId
                        ? {
                              nombre_pedido: resolveSaleName(nombrePedido),
                              estatus_pedido_id: OrderStatusEnum.Closed,
                              costo_domicilio: calcCostoDomicilio(domicilioNum, domicilioActivo, customerPays),
                          }
                        : {}),
                    ...paymentData,
                },
            });
            if (resumeOrderId) invalidateResumeOrderQueries();
            // La venta descontó stock en el backend — sin esto, el catálogo en caché
            // (staleTime de 2 min) sigue mostrando la existencia previa y tanto la UI como
            // la validación de "no exceder el stock disponible" quedan trabajando con datos
            // viejos hasta que algo más invalide la query o el usuario recargue la página.
            queryClient.invalidateQueries({ queryKey: [ApiRoutes.Product] });
            invalidateSalesByCategory(queryClient);

            toast.success(creditPayment.isCreditMode ? "Venta a crédito registrada correctamente." : "Venta registrada correctamente.");
            setShowPayModal(false);
            resetAfterSuccess();
            paymentMethod.setCash("");
            paymentMethod.setPaymentMethodId(null);
            creditPayment.setIsCreditMode(false);
            creditPayment.setSelectedCustomerId(null);

            // Solo se pregunta si hay una impresora ya configurada (agente local o CUPS/red) —
            // si no, se omite el diálogo por completo.
            if (agentConnected && businessConfig?.printer_name?.trim()) {
                const { isConfirmed } = await Swal.fire({
                    title: "¿Imprimir ticket?",
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonColor: "#f59e0b",
                    cancelButtonColor: "#78716c",
                    confirmButtonText: "Imprimir",
                    cancelButtonText: "No, gracias",
                    reverseButtons: true,
                });
                if (isConfirmed) await printTicket(orderId);
            }

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
