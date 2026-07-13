import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useModal } from "@/hooks/useModal";
import { useUpdateOrder } from "@/services/useOrderService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { usePrintTicket } from "@/components/orders/usePrintTicket";
import { logUnexpectedError } from "@/plugins/logger.plugin";

export const usePayModal = (orderId: number, subtotal: number) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isOpen, openModal, closeModal } = useModal();
    const [cash, setCash] = useState("");

    const { mutateAsync: updateOrder, isPending } = useUpdateOrder(orderId);
    const { data: businessConfig } = useGetBusinessConfig();
    const { print } = usePrintTicket(orderId);

    const cashNum = parseFloat(cash) || 0;
    const change = cashNum - subtotal;
    const canPay = cashNum >= subtotal && subtotal > 0;

    const handleOpen = () => {
        setCash("");
        openModal();
    };

    const handlePay = async () => {
        try {
            await updateOrder({ estatus_pedido_id: 3 });
            queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
            toast.success("Orden cerrada exitosamente");
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
                if (result.isConfirmed) print();
            }

            navigate("/");
        } catch (error) {
            logUnexpectedError(error, "usePayModal.handlePay");
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
