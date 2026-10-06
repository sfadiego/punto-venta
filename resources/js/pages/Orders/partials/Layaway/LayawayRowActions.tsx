import { useState } from "react";
import { Eye } from "lucide-react";
import { IOrder } from "@/models/IOrder";
import { useShowOrder } from "@/services/useOrderService";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal/OrderDetailModal";
import { LayawayActionButtons } from "@/components/orders/Layaway/LayawayActionButtons";

interface LayawayRowActionsProps {
    order: IOrder;
}

export const LayawayRowActions = ({ order }: LayawayRowActionsProps) => {
    const [detailOpen, setDetailOpen] = useState(false);
    const { data: orderDetail, isFetching } = useShowOrder(order.id, detailOpen);

    return (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                onClick={() => setDetailOpen(true)}
                title="Ver apartado"
                className="flex items-center justify-center w-8 h-8 rounded-lg text-stone-400 hover:text-orange-600 hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-all"
            >
                <Eye size={18} />
            </button>

            <LayawayActionButtons order={order} />

            <OrderDetailModal
                isOpen={detailOpen}
                order={orderDetail ?? order}
                orderProducts={orderDetail?.order_products ?? []}
                layawayPayments={orderDetail?.layaway_payments}
                isLoadingProducts={isFetching}
                onClose={() => setDetailOpen(false)}
            />
        </div>
    );
};
