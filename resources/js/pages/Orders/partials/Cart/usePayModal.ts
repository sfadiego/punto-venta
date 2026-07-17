import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useModal } from "@/hooks/useModal";
import { useUpdateOrder } from "@/services/useOrderService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { useIndexPaymentMethods } from "@/services/usePaymentMethodService";
import { usePrintTicket } from "@/components/orders/usePrintTicket";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";

export const usePayModal = (orderId: number, subtotal: number) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isOpen, openModal, closeModal } = useModal();
    const [cash, setCash] = useState("");
    const [propina, setPropina] = useState("");
    const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);

    const { mutateAsync: updateOrder, isPending } = useUpdateOrder(orderId);
    const { data: businessConfig } = useGetBusinessConfig();
    const { data: paymentMethods = [] } = useIndexPaymentMethods();
    const { print } = usePrintTicket(orderId);

    const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId) ?? null;
    const isCash = !selectedMethod || selectedMethod.name.toLowerCase().includes("efectivo");

    const cashNum = parseFloat(cash) || 0;
    const change = cashNum - subtotal;
    const canPay = isCash
        ? cashNum >= subtotal && subtotal > 0
        : subtotal > 0;

    const handleOpen = () => {
        setCash("");
        setPropina("");
        const firstMethod = paymentMethods.find((m) => m.active);
        setPaymentMethodId(firstMethod?.id ?? null);
        openModal();
    };

    const handlePay = async () => {
        const propinaNum = parseFloat(propina) || 0;
        try {
            await updateOrder({
                estatus_pedido_id: OrderStatusEnum.Closed,
                payment_method_id: paymentMethodId,
                propina: propinaNum > 0 ? propinaNum : 0,
            });
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
        propina,
        setPropina,
        paymentMethods,
        paymentMethodId,
        setPaymentMethodId,
        isCash,
        handleOpen,
        handleClose: closeModal,
        handlePay,
    };
};
