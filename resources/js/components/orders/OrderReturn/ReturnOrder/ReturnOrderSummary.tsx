interface ReturnOrderSummaryProps {
    orderId: number;
    orderName: string;
    productsCount: number;
    /** Sin esto no hay "Cambiar orden" (la orden viene fija, ej. desde el detalle de la venta). */
    onChange?: () => void;
}

// Orden elegida, en una línea: sustituye al buscador una vez cargada para dejar el espacio a la
// lista de productos. "Cambiar orden" vuelve al buscador.
export const ReturnOrderSummary = ({ orderId, orderName, productsCount, onChange }: ReturnOrderSummaryProps) => (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3.5 py-2.5">
        <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-800">
                #{orderId} · {orderName}
            </p>
            <p className="text-xs text-stone-500">
                {productsCount} {productsCount === 1 ? "producto" : "productos"} en la venta
            </p>
        </div>
        {onChange && (
            <button
                type="button"
                onClick={onChange}
                className="shrink-0 text-sm font-semibold text-amber-600 transition-colors hover:text-amber-700"
            >
                Cambiar orden
            </button>
        )}
    </div>
);
