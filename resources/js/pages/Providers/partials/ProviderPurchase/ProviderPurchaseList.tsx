import { IProviderPurchase } from "@/models/IProvider";
import { formatMoney } from "@/utils/formatCurrency";
import { formatOrderDateTime } from "@/utils/dateUtils";

interface ProviderPurchaseListProps {
    purchases?: IProviderPurchase[];
    isLoading?: boolean;
}

export const ProviderPurchaseList = ({ purchases, isLoading }: ProviderPurchaseListProps) => {
    const total = (purchases ?? []).reduce((sum, purchase) => sum + Number(purchase.amount), 0);

    return (
        <div className="border-t border-stone-100 pt-4">
            <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 mb-3">
                <h2 className="text-sm font-semibold text-amber-900">Historial de compras</h2>
                {!!purchases?.length && (
                    <span className="text-sm font-semibold text-amber-700 tabular-nums">
                        ${formatMoney(total)}
                    </span>
                )}
            </div>
            {isLoading ? (
                <p className="text-sm text-stone-400 px-4">Cargando...</p>
            ) : !purchases || purchases.length === 0 ? (
                <p className="text-sm text-stone-400 px-4">Sin compras registradas.</p>
            ) : (
                <div className="space-y-2 px-4">
                    {purchases.map((purchase) => (
                        <div key={purchase.id} className="flex items-center justify-between text-sm py-1.5 border-b border-stone-50 last:border-0">
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-stone-700">{formatOrderDateTime(purchase.created_at)}</p>
                                    {purchase.is_credit && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold shrink-0">
                                            Crédito
                                        </span>
                                    )}
                                </div>
                                {purchase.note && <p className="text-xs text-stone-400 truncate">{purchase.note}</p>}
                            </div>
                            <span className="font-semibold text-stone-700 tabular-nums shrink-0 ml-2">
                                ${formatMoney(Number(purchase.amount))}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
