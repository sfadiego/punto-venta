import { Eye } from "lucide-react";
import { OrderDeliveryBadge } from "@/components/orders/OrderDeliveryBadge";
import { IOrder } from "@/models/IOrder";
import { useOrderPreviewModal } from "./useOrderPreviewModal";
import { useAxios } from "@/hooks/useAxios";
import { DetailHeader } from "./partials/DetailHeader";
import { CustomerInfoSection } from "./partials/CustomerInfoSection";
import { MarkServedAction } from "./partials/MarkServedAction";
import { ProductList } from "./partials/ProductList";

interface OrderPreviewModalProps {
    order: IOrder;
}

export const OrderPreviewModal = ({ order }: OrderPreviewModalProps) => {
    const {
        isOpen,
        open,
        close,
        productGroups,
        expandedGroups,
        isLoading,
        isServed,
        isUpdatingStatus,
        pendingProductIds,
        isEmpty,
        readyCount,
        totalCount,
        allReady,
        markServed,
        toggleProductReady,
        toggleGroupExpand,
        toggleGroupReady,
    } = useOrderPreviewModal(order.id);
    const { features } = useAxios();
    const showOrderServed = features?.order_served !== false;
    const sellByWeight = features?.sell_by_weight === true;

    return (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    open();
                }}
                disabled={order.total === 0}
                title="Ver detalle"
                className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-orange-600 hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-stone-400 disabled:hover:border-transparent"
            >
                <Eye size={20} />
            </button>

            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
                    onClick={close}
                >
                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DetailHeader nombrePedido={order.nombre_pedido} onClose={close} />

                        <CustomerInfoSection order={order} />

                        {showOrderServed && (
                            <MarkServedAction
                                isServed={isServed}
                                allReady={allReady}
                                isUpdatingStatus={isUpdatingStatus}
                                isEmpty={isEmpty}
                                readyCount={readyCount}
                                totalCount={totalCount}
                                onMarkServed={markServed}
                            />
                        )}

                        {sellByWeight && Number(order.costo_domicilio) !== 0 && (
                            <div className="px-5 py-2.5 border-b border-stone-100 shrink-0">
                                <OrderDeliveryBadge costoDomicilio={order.costo_domicilio} />
                            </div>
                        )}

                        <ProductList
                            isLoading={isLoading}
                            productGroups={productGroups}
                            expandedGroups={expandedGroups}
                            pendingProductIds={pendingProductIds}
                            onToggleGroupExpand={toggleGroupExpand}
                            onToggleGroupReady={toggleGroupReady}
                            onToggleProductReady={toggleProductReady}
                        />
                    </div>
                </div>
            )}
        </>
    );
};
