import { Gift } from "lucide-react";
import { IOrder } from "@/models/IOrder";
import { ILayawayPayment } from "@/models/ILayaway";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { formatDateLabel } from "@/utils/dateUtils";
import { LayawayProgress } from "./LayawayProgress";
import { LayawayDueBadge } from "./LayawayDueBadge";
import { LayawayPaymentsList } from "./LayawayPaymentsList";

interface LayawayOrderSectionProps {
    order: IOrder;
    payments: ILayawayPayment[];
}

// Bloque "Apartado" del detalle de una orden: progreso, fecha límite e historial de abonos.
export const LayawayOrderSection = ({ order, payments }: LayawayOrderSectionProps) => {
    const isActive = order.estatus_pedido_id === OrderStatusEnum.Layaway;

    return (
        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700">
                    <Gift size={13} />
                    Apartado
                </div>
                {isActive && <LayawayDueBadge dueDate={order.layaway_due_date} />}
            </div>

            {isActive && (
                <>
                    <LayawayProgress total={order.total} paid={order.amount_paid} showAmounts />
                    {order.layaway_due_date && (
                        <p className="text-xs text-stone-500">Fecha límite: {formatDateLabel(order.layaway_due_date.slice(0, 10))}</p>
                    )}
                </>
            )}

            <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Historial de abonos</p>
                <LayawayPaymentsList payments={payments} />
            </div>
        </div>
    );
};
