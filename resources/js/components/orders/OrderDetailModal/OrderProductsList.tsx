import { useState } from "react";
import { Loader, ChevronDown, ChevronRight } from "lucide-react";
import { IOrderProduct } from "@/models/IOrderProduct";
import { formatCantidadBadge } from "@/utils/formatUnits";
import { formatCurrencyTrimmed as formatCurrency } from "@/utils/formatCurrency";
import { getOrderProductAddonsUnitTotal } from "@/utils/cartAddons";

interface OrderProductsListProps {
    isLoading: boolean;
    orderProducts: IOrderProduct[];
}

export const OrderProductsList = ({ isLoading, orderProducts }: OrderProductsListProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (isLoading) {
        return (
            <div className="flex justify-center py-4">
                <Loader size={16} className="animate-spin text-stone-400" />
            </div>
        );
    }

    if (orderProducts.length === 0) {
        return <p className="text-xs text-stone-400 italic text-center py-2">Sin productos en esta orden</p>;
    }

    return (
        <div>
            <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                className="flex items-center justify-between w-full text-xs text-stone-400 font-medium mb-1.5"
            >
                <span>Productos ({orderProducts.length})</span>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {isExpanded && (
                <div className="rounded-xl border border-stone-100 divide-y divide-stone-100 max-h-56 overflow-y-auto">
                    {orderProducts.map((item, idx) => (
                        <div key={item.id ?? idx} className="px-3 py-1.5">
                            <div className="flex items-center gap-2">
                                <span className="shrink-0 min-w-[2rem] text-center rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] font-semibold text-stone-600 tabular-nums">
                                    {formatCantidadBadge(item)}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-stone-700 truncate">
                                        {item.product?.nombre ?? "Producto"}
                                        {item.variant && <span className="text-stone-400"> · {item.variant.nombre}</span>}
                                    </p>
                                    {item.product?.product_code && (
                                        <p className="text-[10px] font-semibold text-stone-400 tracking-wide">
                                            COD. {item.product.product_code}
                                        </p>
                                    )}
                                </div>
                                {/* El total de la línea incluye sus toppings (precio unitario + toppings) × cantidad. */}
                                <span className="text-xs font-medium text-stone-700 shrink-0">
                                    {formatCurrency((item.precio + getOrderProductAddonsUnitTotal(item)) * item.cantidad)}
                                </span>
                            </div>
                            {(item.addons ?? []).map((addon) => (
                                <p key={addon.id} className="pl-[2.5rem] text-[11px] text-stone-400 truncate">
                                    + {addon.name}
                                    {addon.quantity > 1 && ` ×${addon.quantity}`}
                                    {addon.price > 0 && ` · ${formatCurrency(addon.price * addon.quantity)}`}
                                </p>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
