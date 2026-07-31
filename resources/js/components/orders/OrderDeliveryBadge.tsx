import { Bike } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface OrderDeliveryBadgeProps {
    costoDomicilio: number | string;
    showEmpty?: boolean;
}

export const OrderDeliveryBadge = ({ costoDomicilio, showEmpty = false }: OrderDeliveryBadgeProps) => {
    const raw = Number(costoDomicilio);
    const amount = Math.abs(raw);
    const hasDelivery = amount > 0;
    const customerPays = raw >= 0;

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
        <div
            className={`flex items-center gap-2 px-3 py-2 border rounded-xl ${
                customerPays ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"
            }`}
        >
            <Bike size={14} className={customerPays ? "text-amber-500 shrink-0" : "text-red-400 shrink-0"} />
            <span className={`text-xs font-medium ${customerPays ? "text-amber-700" : "text-red-600"}`}>
                {customerPays ? "Domicilio (cliente paga)" : "Domicilio (a cuenta del negocio)"}
            </span>
            <span className={`ml-auto text-xs font-semibold ${customerPays ? "text-amber-700" : "text-red-600"}`}>
                {customerPays ? "+" : "-"}
                {formatCurrency(amount)}
            </span>
        </div>
    );
};
