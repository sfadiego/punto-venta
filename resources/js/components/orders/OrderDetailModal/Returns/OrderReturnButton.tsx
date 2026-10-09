import { Undo2 } from "lucide-react";
import { IOrder } from "@/models/IOrder";
import { IOrderProduct } from "@/models/IOrderProduct";
import { OrderReturnModal } from "@/components/orders/OrderReturn/OrderReturnModal";
import { useOrderReturnButton } from "./useOrderReturnButton";

interface OrderReturnButtonProps {
    order: IOrder;
    /** Líneas de la orden (del detalle) — de ahí se sabe si aún queda algo por devolver. */
    orderProducts: IOrderProduct[];
    isLoadingProducts: boolean;
}

// "Devolver productos" en el detalle de una venta cerrada (retail, con permiso): abre la devolución
// con la orden ya elegida, sin pasar por Inventario. Se deshabilita mientras cargan las líneas, cuando
// la venta ya se devolvió por completo y cuando pasó el plazo de devolución del negocio.
export const OrderReturnButton = ({ order, orderProducts, isLoadingProducts }: OrderReturnButtonProps) => {
    const { canReturn, isOpen, open, close, disabledReason } = useOrderReturnButton(order, orderProducts, isLoadingProducts);

    if (!canReturn) return null;

    return (
        <>
            {/* Pegado a la lista de productos (el contenedor separa sus secciones con space-y-5). */}
            <div className="-mt-2 flex justify-end">
                <button
                    type="button"
                    onClick={open}
                    disabled={isLoadingProducts || !!disabledReason}
                    title={disabledReason}
                    className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 transition-colors hover:text-amber-700 disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:text-stone-300"
                >
                    <Undo2 size={14} />
                    Devolver productos
                </button>
            </div>
            {isOpen && <OrderReturnModal orderId={order.id} onClose={close} />}
        </>
    );
};
