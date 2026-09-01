import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useModal } from "@/hooks/useModal";
import { useUpdateOrder } from "@/services/useOrderService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { usePrintTicket } from "@/components/orders/PrintTicket/usePrintTicket";
import { useAxios } from "@/hooks/useAxios";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { calcCostoDomicilio } from "@/utils/deliveryCalc";
import { canPayOrder, resolveDefaultPaymentMethodId } from "@/utils/paymentMethods";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { invalidateSalesByCategory } from "@/services/useSalesByCategoryService";
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
export const usePayModal = (orderId: number, total: number, delivery: DeliveryInfo) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { sistemaId } = useAxios();
    const { isOpen, openModal, closeModal } = useModal();
    const paymentSelection = usePaymentSelection(total);
    const creditSelection = useCreditSelection();

    const { mutateAsync: updateOrder, isPending } = useUpdateOrder(orderId);
    const { data: businessConfig } = useGetBusinessConfig();
    const { print } = usePrintTicket();

    const canPay = canPayOrder({
        isCreditMode: creditSelection.isCreditMode,
        isCash: paymentSelection.isCash,
        total,
        cashNum: paymentSelection.cashNum,
        selectedCustomer: creditSelection.selectedCustomer,
    });

    const handleOpen = () => {
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
            queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
            queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Customer}/list`] });
            // La venta descontó stock en el backend — sin esto, el catálogo en caché sigue
            // mostrando la existencia previa y el ProductGrid no refleja el producto agotado
            // hasta que algo más invalide la query (mismo fix ya aplicado en useQuickSalePayment).
            queryClient.invalidateQueries({ queryKey: [ApiRoutes.Product] });
            if (sistemaId) {
                queryClient.invalidateQueries({
                    queryKey: [`${ApiRoutes.System}/${sistemaId}/total-current-sales`],
                });
            }
            invalidateSalesByCategory(queryClient);
            toast.success(creditSelection.isCreditMode ? "Venta a crédito registrada correctamente" : "Orden cerrada exitosamente");
            closeModal();

            if (businessConfig?.printer_host) {
                const result = await Swal.fire({
                    title: "¿Imprimir ticket?",
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonColor: "#f59e0b",
                    cancelButtonColor: "#78716c",
                    confirmButtonText: "Sí, imprimir",
                    cancelButtonText: "No",
                    reverseButtons: true,
                });
                if (result.isConfirmed) print(orderId);
            }

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
