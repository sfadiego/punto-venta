import { HandCoins } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useCreditCustomersWidget } from "./useCreditCustomersWidget";

interface Props {
    sistemaId: number | null;
}

export default function CreditCustomersWidget({ sistemaId }: Props) {
    const { customers, isLoading } = useCreditCustomersWidget(sistemaId);

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-amber-100">
                    <HandCoins size={16} className="text-amber-600" />
                </div>
                <p className="text-sm font-semibold text-stone-700">Ventas a crédito en este cierre</p>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    <div className="h-4 w-full bg-stone-100 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-stone-100 rounded animate-pulse" />
                </div>
            ) : customers.length === 0 ? (
                <p className="text-sm text-stone-400 italic">Sin ventas a crédito en esta sesión</p>
            ) : (
                <div className="divide-y divide-stone-100">
                    {customers.map((item) => (
                        <div key={item.customer.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-stone-900 truncate">{item.customer.name}</p>
                                <p className="text-xs text-stone-400">
                                    {item.orders_count} venta{item.orders_count !== 1 ? "s" : ""}
                                </p>
                            </div>
                            <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold tabular-nums">
                                {formatCurrency(item.total_credit)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
