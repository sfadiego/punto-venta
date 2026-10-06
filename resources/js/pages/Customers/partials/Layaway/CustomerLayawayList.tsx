import { IOrder } from "@/models/IOrder";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { calcLayawayBalance } from "@/utils/layawayCalc";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { CustomerLayawayItem } from "./CustomerLayawayItem";

interface CustomerLayawayListProps {
    orders?: IOrder[];
    onViewOrder: (order: IOrder) => void;
}

export const CustomerLayawayList = ({ orders = [], onViewOrder }: CustomerLayawayListProps) => {
    const active = orders.filter((order) => order.estatus_pedido_id === OrderStatusEnum.Layaway);
    const pendingBalance = active.reduce((sum, order) => sum + calcLayawayBalance(order.total, order.amount_paid), 0);

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sm:col-span-2">
            <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-sm font-semibold text-stone-900">Apartados</h2>
                {active.length > 0 && (
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                        {active.length} {active.length === 1 ? "activo" : "activos"} · saldo {formatCurrencyTrimmed(pendingBalance)}
                    </span>
                )}
            </div>

            {orders.length === 0 ? (
                <p className="text-sm text-stone-400">Sin apartados registrados.</p>
            ) : (
                <div className="space-y-3">
                    {orders.map((order) => (
                        <CustomerLayawayItem key={order.id} order={order} onViewOrder={onViewOrder} />
                    ))}
                </div>
            )}
        </div>
    );
};
