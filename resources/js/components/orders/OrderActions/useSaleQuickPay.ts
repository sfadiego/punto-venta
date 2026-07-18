import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useUpdateOrder } from "@/services/useOrderService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { useIndexPaymentMethods } from "@/services/usePaymentMethodService";
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

    const { mutateAsync: updateOrder, isPending: isPaying } = useUpdateOrder(order.id);
    const { data: businessConfig } = useGetBusinessConfig();
    const { data: paymentMethods = [] } = useIndexPaymentMethods();
    const { print } = usePrintTicket(order.id);

    const totalFinal = order.total;
    const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId) ?? null;
    const isCashMethod = !selectedMethod || selectedMethod.name.toLowerCase().includes("efectivo");
    const cashNum = parseFloat(cash) || 0;
    const change = cashNum - totalFinal;
    const canPay = isCashMethod
        ? cashNum >= totalFinal && totalFinal > 0
        : totalFinal > 0;

    const openPayModal = () => {
        setCash("");
        const firstActive = paymentMethods.find((m) => m.active);
        setPaymentMethodId(firstActive?.id ?? null);
        setIsOpen(true);
    };

    const closePayModal = () => setIsOpen(false);

    const handlePay = async () => {
        try {
            await updateOrder({
                estatus_pedido_id: OrderStatusEnum.Closed,
                payment_method_id: paymentMethodId,
            });
            queryClient.invalidateQueries({ queryKey: [ApiRoutes.Orders] });
            queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
            if (sistemaId) {
                queryClient.invalidateQueries({
                    queryKey: [`${ApiRoutes.System}/${sistemaId}/total-current-sales`],
                });
            }
            toast.success("Orden cerrada exitosamente");
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
        openPayModal,
        closePayModal,
        handlePay,
    };
};
