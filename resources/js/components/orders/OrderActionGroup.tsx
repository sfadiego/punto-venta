import { Pencil, Trash2, Check, X, Loader } from "lucide-react";
import { IOrder } from "@/models/IOrder";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { usePermissions } from "@/hooks/usePermissions";
import { PayOrderButton } from "./PayOrderButton";
import { PrintTicketButton } from "./PrintTicketButton";
import { OrderPreviewModal } from "./OrderPreviewModal";

interface OrderEditControlsProps {
    isUpdating: boolean;
    onConfirm: (e: React.MouseEvent) => void;
    onCancel: (e: React.MouseEvent) => void;
}

export const OrderEditControls = ({ isUpdating, onConfirm, onCancel }: OrderEditControlsProps) => (
    <>
        <button
            onClick={onConfirm}
            disabled={isUpdating}
            title="Confirmar"
            className="flex items-center justify-center w-7 h-7 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all disabled:opacity-50"
        >
            {isUpdating ? <Loader size={13} className="animate-spin" /> : <Check size={13} />}
        </button>
        <button
            onClick={onCancel}
            title="Cancelar edición"
            className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 border border-transparent hover:border-stone-200 transition-all"
        >
            <X size={13} />
        </button>
    </>
);

interface OrderActionGroupProps {
    order: IOrder;
    onEditStart: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => Promise<void>;
    isDeleting: boolean;
    onSuccess?: () => void;
    showPrintLabel?: boolean;
}

/**
 * Botones de acción compartidos entre el dashboard (OrderCard)
 * y el listado de órdenes (OrderActionButtons).
 * NO incluye el botón de navegar a take-order — ese es específico de cada contexto.
 */
export const OrderActionGroup = ({
    order,
    onEditStart,
    onDelete,
    isDeleting,
    onSuccess,
    showPrintLabel = false,
}: OrderActionGroupProps) => {
    const { can } = usePermissions();

    const isPayable = [OrderStatusEnum.InProcess, OrderStatusEnum.ReadyToServe].includes(
        order.estatus_pedido_id,
    );
    const isKitchenVisible = [OrderStatusEnum.InProcess, OrderStatusEnum.ReadyToServe].includes(
        order.estatus_pedido_id,
    );

    return (
        <>
            {can("kitchenView") && isKitchenVisible && <OrderPreviewModal order={order} />}

            {can("printTicket") && <PrintTicketButton orderId={order.id} showLabel={showPrintLabel} />}

            {can("payOrder") && isPayable && (
                <PayOrderButton
                    order={order}
                    onSuccess={onSuccess}
                    showLabel={false}
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                />
            )}

            {can("editOrderName") && (
                <button
                    onClick={onEditStart}
                    title="Editar nombre"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all"
                >
                    <Pencil size={13} />
                </button>
            )}

            {can("deleteOrder") && (
                <button
                    onClick={onDelete}
                    disabled={isDeleting}
                    title="Eliminar orden"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all disabled:opacity-50"
                >
                    {isDeleting
                        ? <Loader size={13} className="animate-spin text-red-500" />
                        : <Trash2 size={13} />
                    }
                </button>
            )}
        </>
    );
};
