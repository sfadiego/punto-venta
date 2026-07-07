import { useState } from "react";
import { PrintTicketButton } from "./PrintTicketButton";
import { OrderDetailModal } from "@/pages/Sales/partials/OrderDetailModal";
import { usePermissions } from "@/hooks/usePermissions";
import { IOrder } from "@/models/IOrder";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { Eye } from "lucide-react";

interface SaleActionsProps {
    order: IOrder;
}

export const SaleActions = ({ order }: SaleActionsProps) => {
    const { can } = usePermissions();
    const [detailOpen, setDetailOpen] = useState(false);
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

            <OrderDetailModal
                isOpen={detailOpen}
                order={order}
                onClose={() => setDetailOpen(false)}
            />
        </div>
    );
};
