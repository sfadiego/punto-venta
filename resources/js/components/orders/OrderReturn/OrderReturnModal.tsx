import { Modal } from "@mantine/core";
import { Undo2 } from "lucide-react";
import { OrderReturnPanel } from "./OrderReturnPanel";
import { useOrderReturnPanel } from "./useOrderReturnPanel";

interface OrderReturnModalProps {
    orderId: number;
    onClose: () => void;
}

// Devolución de una orden ya elegida (se abre desde el detalle de la venta). Se monta solo mientras
// está abierto (el padre lo renderiza condicionalmente) — así el formulario siempre arranca limpio.
export const OrderReturnModal = ({ orderId, onClose }: OrderReturnModalProps) => {
    const panel = useOrderReturnPanel({ initialOrderId: orderId, onReturned: onClose });

    return (
        <Modal
            opened
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Undo2 size={18} className="text-amber-500" />
                    <span className="font-semibold text-stone-800">Devolución de productos</span>
                </div>
            }
            size="lg"
            radius="lg"
            padding="lg"
        >
            <OrderReturnPanel {...panel} />
        </Modal>
    );
};
