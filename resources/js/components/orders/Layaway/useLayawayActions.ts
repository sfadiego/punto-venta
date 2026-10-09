import { useState } from "react";
import { useAxios } from "@/hooks/useAxios";

// Acciones sobre un apartado activo: abrir el modal de abono y el de cancelación. Ambos exigen una
// caja abierta (el dinero tiene que caer en un cuadre).
export const useLayawayActions = () => {
    const { sistemaId } = useAxios();
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);

    return {
        canOperate: !!sistemaId,
        isPaymentOpen,
        openPayment: () => setIsPaymentOpen(true),
        closePayment: () => setIsPaymentOpen(false),
        isCancelOpen,
        openCancel: () => setIsCancelOpen(true),
        closeCancel: () => setIsCancelOpen(false),
    };
};
