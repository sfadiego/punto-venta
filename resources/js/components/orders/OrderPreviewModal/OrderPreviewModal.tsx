import { Eye } from "lucide-react";
import { IOrder } from "@/models/IOrder";
import { useOrderPreviewModal } from "./useOrderPreviewModal";
import { useAxios } from "@/hooks/useAxios";
import { DetailHeader } from "./partials/DetailHeader";
import { CustomerInfoSection } from "./partials/CustomerInfo/CustomerInfoSection";
import { MarkServedAction } from "./partials/MarkServedAction";
import { OrderTotalSummary } from "./partials/OrderTotalSummary";
import { ProductList } from "./partials/Products/ProductList";

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

                        <OrderTotalSummary
                            subtotal={order.subtotal}
                            costoDomicilio={order.costo_domicilio}
                            total={order.total}
                        />

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
