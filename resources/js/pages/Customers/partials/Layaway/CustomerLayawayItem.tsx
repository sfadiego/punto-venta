import { ChevronDown, Eye } from "lucide-react";
import { IOrder } from "@/models/IOrder";
import { getLayawayStatusLabel, getLayawayStatusStyle } from "@/utils/orderStatus";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { formatDateLabel, formatOrderDateTime } from "@/utils/dateUtils";
import { LayawayProgress } from "@/components/orders/Layaway/Detail/LayawayProgress";
import { LayawayPaymentsList } from "@/components/orders/Layaway/Detail/LayawayPaymentsList";
import { LayawayProductsList } from "@/components/orders/Layaway/Products/LayawayProductsList";
import { LayawayProductsModal } from "@/components/orders/Layaway/Products/LayawayProductsModal";
import { summarizeOrderProducts } from "@/utils/orderProductsSummary";
import { LayawayActionButtons } from "@/components/orders/Layaway/LayawayActionButtons";
import { useCustomerLayawayItem } from "./useCustomerLayawayItem";

interface CustomerLayawayItemProps {
    order: IOrder;
    onViewOrder: (order: IOrder) => void;
}

export const CustomerLayawayItem = ({ order, onViewOrder }: CustomerLayawayItemProps) => {
    const { isActive, isExpanded, toggle, products, previewProducts, hasMoreProducts, isProductsOpen, openProducts, closeProducts } =
        useCustomerLayawayItem(order);

    return (
        <div className="border border-stone-200 rounded-2xl">
            <div className="flex items-center gap-2 pr-3">
                <button
                    type="button"
                    onClick={toggle}
                    aria-expanded={isExpanded}
                    className="flex-1 min-w-0 flex items-center gap-3 text-left px-4 py-3 rounded-2xl hover:bg-stone-50 transition-colors"
                >
                    <ChevronDown
                        size={16}
                        className={`shrink-0 text-stone-400 transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"}`}
                    />
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-stone-900 flex items-center gap-2 flex-wrap">
                            Apartado #{order.id}
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getLayawayStatusStyle(order.estatus_pedido_id)}`}>
                                {getLayawayStatusLabel(order.estatus_pedido_id)}
                            </span>
                        </p>
                        {order.order_products && order.order_products.length > 0 && (
                            <p className="text-xs text-stone-600 mt-0.5 truncate">{summarizeOrderProducts(order.order_products)}</p>
                        )}
                        <p className="text-xs text-stone-400 mt-0.5 truncate">
                            {formatCurrencyTrimmed(order.total)} · {formatOrderDateTime(order.created_at)}
                            {isActive && order.layaway_due_date && ` · vence el ${formatDateLabel(order.layaway_due_date.slice(0, 10))}`}
                        </p>
                    </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                    {isActive ? (
                        <LayawayActionButtons order={order} />
                    ) : (
                        <button
                            type="button"
                            onClick={() => onViewOrder(order)}
                            title="Ver venta"
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                            <Eye size={16} />
                        </button>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="pay-panel-enter px-4 pb-4 pt-1 border-t border-stone-100">
                    <div className="flex items-center justify-between gap-2 mt-3 mb-1">
                        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                            Productos apartados ({products.length})
                        </p>
                        {hasMoreProducts && (
                            <button
                                type="button"
                                onClick={openProducts}
                                className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                            >
                                Ver todos
                            </button>
                        )}
                    </div>
                    <LayawayProductsList orderProducts={previewProducts} compact />
                    {hasMoreProducts && (
                        <button
                            type="button"
                            onClick={openProducts}
                            className="mt-1 text-xs text-stone-400 hover:text-stone-600 transition-colors"
                        >
                            y {products.length - previewProducts.length} más…
                        </button>
                    )}

                    {isActive && (
                        <div className="mt-3">
                            <LayawayProgress total={order.total} paid={order.amount_paid} showAmounts />
                        </div>
                    )}

                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mt-3 mb-1">Historial de abonos</p>
                    <LayawayPaymentsList payments={order.layaway_payments ?? []} />
                </div>
            )}

            {isProductsOpen && <LayawayProductsModal order={order} onClose={closeProducts} />}
        </div>
    );
};
