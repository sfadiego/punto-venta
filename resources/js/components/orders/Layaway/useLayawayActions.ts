import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useAxios } from "@/hooks/useAxios";
import { invalidateLayawayQueries, useCancelLayaway } from "@/services/useLayawayService";
import { IOrder } from "@/models/IOrder";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { formatCurrency } from "@/utils/formatCurrency";

// Acciones sobre un apartado activo: abrir el modal de abono y cancelarlo (con confirmación —
// la cancelación devuelve el stock y reembolsa lo abonado desde la caja abierta actual).
export const useLayawayActions = (order: IOrder) => {
    const queryClient = useQueryClient();
    const { sistemaId } = useAxios();
    const { mutateAsync: cancelLayaway, isPending: isCancelling } = useCancelLayaway();
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    const handleCancel = async () => {
        if (!sistemaId) return;
        const result = await Swal.fire({
            title: "¿Cancelar apartado?",
            text: `Se devolverá el stock y se reembolsarán ${formatCurrency(order.amount_paid)} al cliente desde la caja abierta.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#78716c",
            cancelButtonText: "Volver",
            confirmButtonText: "Sí, cancelar apartado",
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;

        try {
            await cancelLayaway({ orderId: order.id, data: { sistema_id: sistemaId } });
            invalidateLayawayQueries(queryClient, { orderId: order.id, customerId: order.customer_id, sistemaId });
            toast.success("Apartado cancelado y reembolsado");
        } catch (error) {
            logUnexpectedError(error, "useLayawayActions.cancel");
            toast.error(getUserFacingErrorMessage(error, "Error al cancelar el apartado"));
        }
    };

    return {
        canOperate: !!sistemaId,
        isPaymentOpen,
        openPayment: () => setIsPaymentOpen(true),
        closePayment: () => setIsPaymentOpen(false),
        handleCancel,
        isCancelling,
    };
};
