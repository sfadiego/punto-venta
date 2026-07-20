import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useUpdateOrder } from "@/services/useOrderService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { useIndexPaymentMethods } from "@/services/usePaymentMethodService";
import { useCustomerList } from "@/services/useCustomerService";
import { usePrintTicket } from "@/components/orders/PrintTicket/usePrintTicket";
import { useAxios } from "@/hooks/useAxios";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IOrder } from "@/models/IOrder";

export const useSaleQuickPay = (order: IOrder) => {
    const queryClient = useQueryClient();
    const { sistemaId } = useAxios();
    const [isOpen, setIsOpen] = useState(false);
    const [cash, setCash] = useState("");
    const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
    const [isCreditMode, setIsCreditMode] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

    const { mutateAsync: updateOrder, isPending: isPaying } = useUpdateOrder(order.id);
    const { data: businessConfig } = useGetBusinessConfig();
    const { data: paymentMethods = [] } = useIndexPaymentMethods();
    const { data: customers = [] } = useCustomerList();
    const { print } = usePrintTicket(order.id);

    const totalFinal = order.total;
    const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId) ?? null;
    const isCashMethod = !selectedMethod || selectedMethod.name.toLowerCase().includes("efectivo");
    const cashNum = parseFloat(cash) || 0;
    const change = cashNum - totalFinal;
    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;
    const canPay = isCreditMode
        ? totalFinal > 0 && !!selectedCustomer && selectedCustomer.allow_credit
        : isCashMethod
            ? cashNum >= totalFinal && totalFinal > 0
            : totalFinal > 0;

    const openPayModal = () => {
        setCash("");
        setIsCreditMode(false);
        setSelectedCustomerId(null);
        const firstActive = paymentMethods.find((m) => m.active);
        setPaymentMethodId(firstActive?.id ?? null);
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
            queryClient.invalidateQueries({ queryKey: [ApiRoutes.Orders] });
            queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
            queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Customer}/list`] });
            if (sistemaId) {
                queryClient.invalidateQueries({
                    queryKey: [`${ApiRoutes.System}/${sistemaId}/total-current-sales`],
                });
            }
            toast.success(isCreditMode ? "Venta a crédito registrada correctamente" : "Orden cerrada exitosamente");
            closePayModal();

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
                if (result.isConfirmed) print();
            }
        } catch (error) {
            logUnexpectedError(error, "useSaleQuickPay.handlePay");
            toast.error("Error al cerrar la orden");
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
