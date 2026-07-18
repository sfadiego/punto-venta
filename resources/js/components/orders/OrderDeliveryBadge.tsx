import { Bike } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface OrderDeliveryBadgeProps {
    costoDomicilio: number | string;
    showEmpty?: boolean;
}

export const OrderDeliveryBadge = ({ costoDomicilio, showEmpty = false }: OrderDeliveryBadgeProps) => {
    const amount = Math.abs(Number(costoDomicilio));
    const hasDelivery = amount > 0;

    if (!hasDelivery && !showEmpty) return null;

    if (!hasDelivery) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-100 rounded-xl">
                <Bike size={14} className="text-stone-300 shrink-0" />
                <span className="text-xs text-stone-400">Sin envío a domicilio</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
            <Bike size={14} className="text-red-400 shrink-0" />
            <span className="text-xs font-medium text-red-600">Envío a domicilio</span>
            <span className="ml-auto text-xs font-semibold text-red-600">
                -{formatCurrency(amount)}
            </span>
        </div>
    );
};
