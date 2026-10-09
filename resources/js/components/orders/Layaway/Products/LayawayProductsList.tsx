import { IOrderProduct } from "@/models/IOrderProduct";
import { formatCantidadBadge } from "@/utils/formatUnits";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { getOrderProductName } from "@/utils/orderProductsSummary";

interface LayawayProductsListProps {
    orderProducts?: IOrderProduct[];
    /** Filas de una sola línea (cantidad, nombre, código y total) para listas en línea; sin esto cada fila
     * lleva el código en una segunda línea (uso en el modal con la lista completa). */
    compact?: boolean;
}

// Qué se apartó: las líneas de la orden con su cantidad, nombre, código y total.
export const LayawayProductsList = ({ orderProducts = [], compact = false }: LayawayProductsListProps) => {
    if (orderProducts.length === 0) {
        return <p className="text-xs text-stone-400">Sin productos registrados.</p>;
    }

    return (
        <div className="divide-y divide-stone-100">
            {orderProducts.map((item, index) => (
                <div key={item.id ?? index} className={`flex items-center gap-3 text-sm ${compact ? "py-1.5" : "py-2"}`}>
                    <span className="shrink-0 min-w-[2rem] text-center rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] font-semibold text-stone-600 tabular-nums">
                        {formatCantidadBadge(item)}
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-stone-700 truncate">
                            {getOrderProductName(item)}
                            {compact && item.product?.product_code && (
                                <span className="ml-2 text-[10px] font-semibold text-stone-400 tracking-wide">COD. {item.product.product_code}</span>
                            )}
                        </p>
                        {!compact && item.product?.product_code && (
                            <p className="text-[10px] font-semibold text-stone-400 tracking-wide">COD. {item.product.product_code}</p>
                        )}
                    </div>
                    <span className="shrink-0 font-medium text-stone-700 tabular-nums">
                        {formatCurrencyTrimmed(item.precio * item.cantidad)}
                    </span>
                </div>
            ))}
        </div>
    );
};
