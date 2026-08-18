import { Eye } from "lucide-react";
import { IOrder } from "@/models/IOrder";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { formatOrderDateTime } from "@/utils/dateUtils";

interface CustomerCreditOrdersListProps {
    orders?: IOrder[];
    onViewOrder: (order: IOrder) => void;
}

export const CustomerCreditOrdersList = ({ orders, onViewOrder }: CustomerCreditOrdersListProps) => (
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
                            <p className="text-xs text-stone-400">{formatOrderDateTime(order.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                            <span className="font-semibold text-stone-800 tabular-nums">
                                {formatCurrencyTrimmed(order.total)}
                            </span>
                            <button
                                onClick={() => onViewOrder(order)}
                                title="Ver venta"
                                className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                                <Eye size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);
