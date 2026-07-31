import { formatCurrency } from "@/utils/formatCurrency";

interface OrderTotalSummaryProps {
    subtotal: number;
    costoDomicilio: number | string;
    total: number;
}

export const OrderTotalSummary = ({ subtotal, costoDomicilio, total }: OrderTotalSummaryProps) => {
    const raw = Number(costoDomicilio);
    const hasDelivery = raw !== 0;
    const customerPays = raw >= 0;
    const amount = Math.abs(raw);

    return (
        <div className="px-5 py-2.5 border-b border-stone-100 shrink-0 space-y-1">
            <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400">Subtotal</span>
                <span className="text-xs text-stone-600">{formatCurrency(subtotal)}</span>
            </div>

            {hasDelivery && (
                <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-400">
                        {customerPays ? "Domicilio (cliente paga)" : "Domicilio (a cuenta del negocio)"}
                    </span>
                    <span className={`text-xs font-medium ${customerPays ? "text-amber-600" : "text-stone-400"}`}>
                        {customerPays ? "+" : "-"}
                        {formatCurrency(amount)}
                    </span>
                </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                <span className="text-xs font-semibold text-stone-700">Total</span>
                <span className="text-sm font-bold text-stone-900">{formatCurrency(total)}</span>
            </div>
        </div>
    );
};
