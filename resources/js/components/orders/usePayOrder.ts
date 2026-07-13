import { useState } from "react";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useModal } from "@/hooks/useModal";
import { useUpdateOrder } from "@/services/useOrderService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { useIndexPaymentMethods } from "@/services/usePaymentMethodService";
import { usePrintTicket } from "./usePrintTicket";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { IOrder } from "@/models/IOrder";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

export const usePayOrder = (order: IOrder, onSuccess?: () => void) => {
    const queryClient = useQueryClient();
    const { isOpen, openModal, closeModal } = useModal();
    const [cash, setCash] = useState("");
    const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);

    const { mutateAsync: updateOrder, isPending } = useUpdateOrder(order.id);
    const { data: businessConfig } = useGetBusinessConfig();
    const { data: paymentMethods = [] } = useIndexPaymentMethods();
    const { print } = usePrintTicket(order.id);

    const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId) ?? null;
    const isCash = !selectedMethod || selectedMethod.name.toLowerCase().includes("efectivo");

    const cashNum = parseFloat(cash) || 0;
    const change = cashNum - order.total;
    const canPay = isCash
        ? cashNum >= order.total && order.total > 0
        : order.total > 0;

    const handleOpen = () => {
        setCash("");
        const firstMethod = paymentMethods.find((m) => m.active);
        setPaymentMethodId(firstMethod?.id ?? null);
        openModal();
    };

    const handlePay = async () => {
        try {
            await updateOrder({
                estatus_pedido_id: OrderStatusEnum.Closed,
                payment_method_id: paymentMethodId,
            });
            queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
            queryClient.invalidateQueries({ queryKey: [ApiRoutes.Orders] });
            toast.success("Orden cerrada exitosamente");
            closeModal();
            onSuccess?.();

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
            logUnexpectedError(error, "usePayOrder.handlePay");
            toast.error("Error al cerrar la orden");
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
        paymentMethods,
        paymentMethodId,
        setPaymentMethodId,
        isCash,
        handleOpen,
        handleClose: closeModal,
        handlePay,
    };
};
