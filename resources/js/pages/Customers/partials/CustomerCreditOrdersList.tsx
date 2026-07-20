import { IOrder } from "@/models/IOrder";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatOrderTime } from "@/utils/dateUtils";

interface CustomerCreditOrdersListProps {
    orders?: IOrder[];
}

export const CustomerCreditOrdersList = ({ orders }: CustomerCreditOrdersListProps) => (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-stone-900 mb-3">Pedidos a crédito</h2>
        {!orders || orders.length === 0 ? (
            <p className="text-sm text-stone-400">Sin pedidos a crédito registrados.</p>
        ) : (
            <div className="space-y-2">
                {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between text-sm py-1.5 border-b border-stone-50 last:border-0">
                        <div className="min-w-0">
                            <p className="text-stone-700 truncate">{order.nombre_pedido}</p>
                            <p className="text-xs text-stone-400">{formatOrderTime(order.created_at)}</p>
                        </div>
                        <span className="font-semibold text-stone-800 tabular-nums shrink-0 ml-2">
                            {formatCurrency(order.total)}
                        </span>
                    </div>
                ))}
            </div>
        )}
    </div>
);
