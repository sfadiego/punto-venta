import { useState } from "react";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useModal } from "@/hooks/useModal";
import { useUpdateOrder } from "@/services/useOrderService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { usePrintTicket } from "./usePrintTicket";
import { IOrder } from "@/models/IOrder";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

export const usePayOrder = (order: IOrder, onSuccess?: () => void) => {
    const queryClient = useQueryClient();
    const { isOpen, openModal, closeModal } = useModal();
    const [cash, setCash] = useState("");

    const { mutateAsync: updateOrder, isPending } = useUpdateOrder(order.id);
    const { data: businessConfig } = useGetBusinessConfig();
    const { print } = usePrintTicket(order.id);

    const cashNum = parseFloat(cash) || 0;
    const change = cashNum - order.total;
    const canPay = cashNum >= order.total && order.total > 0;

    const handleOpen = () => {
        setCash("");
        openModal();
    };

    const handlePay = async () => {
        try {
            await updateOrder({ estatus_pedido_id: 3 });
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
        handleOpen,
        handleClose: closeModal,
        handlePay,
    };
};
