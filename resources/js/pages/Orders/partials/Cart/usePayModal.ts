import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useModal } from "@/hooks/useModal";
import { useUpdateOrder } from "@/services/useOrderService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { useIndexPaymentMethods } from "@/services/usePaymentMethodService";
import { useCustomerList } from "@/services/useCustomerService";
import { usePrintTicket } from "@/components/orders/PrintTicket/usePrintTicket";
import { useAxios } from "@/hooks/useAxios";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { calcCostoDomicilio } from "@/utils/deliveryCalc";
import { resolveDefaultPaymentMethodId } from "@/utils/paymentMethods";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

interface DeliveryInfo {
    domicilio: number;
    domicilioActivo: boolean;
    customerPays: boolean;
}

export const usePayModal = (orderId: number, total: number, delivery: DeliveryInfo) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { sistemaId } = useAxios();
    const { isOpen, openModal, closeModal } = useModal();
    const [cash, setCash] = useState("");
    const [propina, setPropina] = useState("");
    const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
    const [isCreditMode, setIsCreditMode] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

    const { mutateAsync: updateOrder, isPending } = useUpdateOrder(orderId);
    const { data: businessConfig } = useGetBusinessConfig();
    const { data: paymentMethods = [] } = useIndexPaymentMethods();
    const { data: customers = [] } = useCustomerList();
    const { print } = usePrintTicket();

    const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId) ?? null;
    const isCash = !selectedMethod || selectedMethod.name.toLowerCase().includes("efectivo");
    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;

    const cashNum = parseFloat(cash) || 0;
    const change = cashNum - total;
    const canPay = isCreditMode
        ? total > 0 && !!selectedCustomer && selectedCustomer.allow_credit
        : isCash
            ? cashNum >= total && total > 0
            : total > 0;

    const handleOpen = () => {
        setCash("");
        setPropina("");
        setIsCreditMode(false);
        setSelectedCustomerId(null);
        setPaymentMethodId(resolveDefaultPaymentMethodId(paymentMethods));
        openModal();
    };

    const handleSelectCredit = () => {
        setIsCreditMode(true);
        setPaymentMethodId(null);
    };

    const handleSelectMethod = (id: number) => {
        setIsCreditMode(false);
        setPaymentMethodId(id);
    };

    const handlePay = async () => {
        const propinaNum = parseFloat(propina) || 0;
        const paymentData = isCreditMode
            ? { is_credit: true, customer_id: selectedCustomerId }
            : { payment_method_id: paymentMethodId, propina: propinaNum > 0 ? propinaNum : 0 };
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
            if (sistemaId) {
                queryClient.invalidateQueries({
                    queryKey: [`${ApiRoutes.System}/${sistemaId}/total-current-sales`],
                });
            }
            toast.success(isCreditMode ? "Venta a crédito registrada correctamente" : "Orden cerrada exitosamente");
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
        cash,
        setCash,
        cashNum,
        change,
        canPay,
        isPending,
        propina,
        setPropina,
        paymentMethods,
        paymentMethodId,
        isCash,
        isCreditMode,
        selectedCustomerId,
        setSelectedCustomerId,
        customers,
        handleOpen,
        handleClose: closeModal,
        handlePay,
        handleSelectCredit,
        handleSelectMethod,
    };
};
