import { Undo2 } from "lucide-react";
import { IOrderProduct } from "@/models/IOrderProduct";
import { trimDecimalZeros } from "@/utils/formatDecimal";
import { formatOrderDateTime } from "@/utils/dateUtils";

interface OrderReturnsListProps {
    orderProducts: IOrderProduct[];
}

// Solo se renderiza cuando la orden tiene al menos una devolución (order.has_return) — junta
// los movimientos de reason=Return de todas las líneas, más reciente primero. Compacto a
// propósito: es información secundaria dentro de un modal ya lleno (productos + totales).
export const OrderReturnsList = ({ orderProducts }: OrderReturnsListProps) => {
    const returns = orderProducts
        .flatMap((op) => (op.stock_movements ?? []).map((movement) => ({ movement, line: op })))
        .sort((a, b) => (a.movement.created_at < b.movement.created_at ? 1 : -1));

    if (returns.length === 0) return null;

    return (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1">
                <Undo2 size={12} />
                Devoluciones
            </div>
            <div className="divide-y divide-amber-200/60">
                {returns.map(({ movement, line }) => (
                    <div key={movement.id} className="py-1 text-xs text-stone-600 leading-snug">
                        <span className="font-medium text-stone-800">
                            {line.product?.nombre ?? "Producto"}
                            {line.variant?.nombre && ` (${line.variant.nombre})`}
                        </span>
                        {" · x"}{trimDecimalZeros(movement.quantity)}
                        {" — "}{formatOrderDateTime(movement.created_at)}
                        {movement.created_by?.nombre && ` · ${movement.created_by.nombre}`}
                        {movement.note && <span className="italic text-stone-400"> · "{movement.note}"</span>}
                    </div>
                ))}
            </div>
        </div>
    );
};
