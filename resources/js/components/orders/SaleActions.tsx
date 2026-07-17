import { useState } from "react";
import { Eye, Trash2, Loader } from "lucide-react";
import { PrintTicketButton } from "./PrintTicketButton";
import { OrderDetailModal } from "@/pages/Sales/partials/OrderDetailModal/OrderDetailModal";
import { usePermissions } from "@/hooks/usePermissions";
import { useOrderActions } from "./useOrderActions";
import { IOrder } from "@/models/IOrder";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";

interface SaleActionsProps {
    order: IOrder;
}

export const SaleActions = ({ order }: SaleActionsProps) => {
    const { can } = usePermissions();
    const [detailOpen, setDetailOpen] = useState(false);
    const { handleDelete, isDeleting } = useOrderActions(order);

    const isClosed = order.estatus_pedido_id === OrderStatusEnum.Closed;

    return (
        <div
            className="flex items-center justify-center gap-1"
            onClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={() => setDetailOpen(true)}
                title="Ver detalle"
                className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400
                        hover:text-orange-600 hover:bg-orange-50 border border-transparent
                        hover:border-orange-200 transition-all"
            >
                <Eye size={20} />
            </button>

            {can("printTicket") && <PrintTicketButton orderId={order.id} />}

            {can("deleteOrder") && !isClosed && (
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    title="Eliminar orden"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400
                            hover:text-red-600 hover:bg-red-50 border border-transparent
                            hover:border-red-200 transition-all disabled:opacity-50"
                >
                    {isDeleting
                        ? <Loader size={20} className="animate-spin text-red-500" />
                        : <Trash2 size={20} />
                    }
                </button>
            )}

            <OrderDetailModal
                isOpen={detailOpen}
                order={order}
                onClose={() => setDetailOpen(false)}
            />
        </div>
    );
};
