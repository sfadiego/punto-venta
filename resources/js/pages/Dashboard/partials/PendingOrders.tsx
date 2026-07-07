import { Clock, ShoppingBag } from "lucide-react";
import { IOrder } from "@/models/IOrder";
import { formatOrderTime } from "@/pages/Dashboard/useDashboard";

interface PendingOrdersProps {
    orders: IOrder[];
    isLoading: boolean;
    onSelect: (order: IOrder) => void;
}

export const PendingOrders = ({ orders, isLoading, onSelect }: PendingOrdersProps) => {
    if (!isLoading && orders.length === 0) return null;

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
                <Clock size={15} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-stone-700">Pedidos en proceso</h2>
                {orders.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        {orders.length}
                    </span>
                )}
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-stone-100 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {orders.map((order) => (
                        <button
                            key={order.id}
                            onClick={() => onSelect(order)}
                            className="flex flex-col items-start p-3 rounded-xl border-2 border-amber-200 bg-amber-50
                                hover:border-amber-400 hover:bg-amber-100 transition-all text-left group"
                        >
                            <div className="flex items-center gap-1.5 w-full mb-1">
                                <ShoppingBag size={13} className="text-amber-500 shrink-0" />
                                <p className="text-xs font-semibold text-stone-800 truncate flex-1 group-hover:text-amber-700">
                                    {order.nombre_pedido || `Pedido #${order.id}`}
                                </p>
                            </div>
                            <p className="text-base font-bold text-amber-600">${order.total.toFixed(2)}</p>
                            <p className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1">
                                <Clock size={9} />
                                {formatOrderTime(order.created_at)}
                            </p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
