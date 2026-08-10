import { useState } from "react";
import { NavigateFunction } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { usePrintAgent } from "@/hooks/usePrintAgent";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { useStoreOrderSale, useUpdateOrderData, usePrintOrder, useFetchPrintBytes } from "@/services/useOrderService";
import { useIndexPaymentMethods } from "@/services/usePaymentMethodService";
import { useCustomerList } from "@/services/useCustomerService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { resolveSaleName } from "@/utils/resolveSaleName";
import { calcCostoDomicilio } from "@/utils/deliveryCalc";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { IOrder } from "@/models/IOrder";
import { IModalCartItem } from "@/models/IModalCartItem";
import { useInvalidateResumeOrderQueries } from "./useInvalidateResumeOrderQueries";

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
// (se pregunta solo si hay una impresora ya configurada).
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
    const { data: businessConfig } = useGetBusinessConfig();
    const { isConnected: agentConnected, print: agentPrint } = usePrintAgent();
    const { mutateAsync: printOrder } = usePrintOrder();
    const fetchPrintBytes = useFetchPrintBytes();
    const { mutateAsync: updateOrderData } = useUpdateOrderData();
    const { mutateAsync: storeOrderSale } = useStoreOrderSale();
    const { data: paymentMethods = [] } = useIndexPaymentMethods();
    const { data: customers = [] } = useCustomerList();

    const [showPayModal, setShowPayModal] = useState(false);
    const [cash, setCash] = useState("");
    const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
    const [isCreditMode, setIsCreditMode] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [isPaying, setIsPaying] = useState(false);

    const cashNum = parseFloat(cash) || 0;
    const change = cashNum - total;
    const selectedPaymentMethod = paymentMethods.find((m) => m.id === paymentMethodId) ?? null;
    const isCashMethod = !selectedPaymentMethod || selectedPaymentMethod.name.toLowerCase().includes("efectivo");
    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;
    const canPay = isCreditMode
        ? !domicilioExcedeTotal && total > 0 && !!selectedCustomer && selectedCustomer.allow_credit
        : !domicilioExcedeTotal && (isCashMethod ? cashNum >= total && total > 0 : total > 0);

    const openPayModal = () => {
        if (!sistemaId) {
            toast.error("No hay una caja abierta.");
            return;
        }
        if (!hasAnything) return;
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
                    items: cart.map((item) => ({ producto_id: item.productId, cantidad: item.cantidad })),
                });
                orderId = (res as { data: { data: IOrder } }).data.data.id;
            }

            const paymentData = isCreditMode
                ? { is_credit: true, customer_id: selectedCustomerId }
                : { payment_method_id: paymentMethodId };

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

            toast.success(isCreditMode ? "Venta a crédito registrada correctamente." : "Venta registrada correctamente.");
            setShowPayModal(false);
            resetAfterSuccess();
            setCash("");
            setPaymentMethodId(null);
            setIsCreditMode(false);
            setSelectedCustomerId(null);

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
        openPayModal,
        showPayModal,
        setShowPayModal,
        cash,
        setCash,
        cashNum,
        change,
        canPay,
        paymentMethods,
        paymentMethodId,
        setPaymentMethodId,
        isCashMethod,
        isCreditMode,
        setIsCreditMode,
        customers,
        selectedCustomerId,
        setSelectedCustomerId,
        isPaying,
        handlePay,
    };
};
