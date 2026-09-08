import { Undo2 } from "lucide-react";
import { IOrderProduct } from "@/models/IOrderProduct";
import { trimDecimalZeros } from "@/utils/formatDecimal";
import { formatOrderDateTime } from "@/utils/dateUtils";

interface OrderReturnsListProps {
    orderProducts: IOrderProduct[];
}

// Solo se renderiza cuando la orden tiene al menos una devolución (order.has_return) — junta
// los movimientos de reason=Return de todas las líneas, más reciente primero.
export const OrderReturnsList = ({ orderProducts }: OrderReturnsListProps) => {
    const returns = orderProducts
        .flatMap((op) => (op.stock_movements ?? []).map((movement) => ({ movement, line: op })))
        .sort((a, b) => (a.movement.created_at < b.movement.created_at ? 1 : -1));

    if (returns.length === 0) return null;

    return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                <Undo2 size={14} />
                Devoluciones
            </div>
            <div className="space-y-2.5">
                {returns.map(({ movement, line }) => (
                    <div key={movement.id} className="flex items-start justify-between gap-3 text-sm">
                        <div>
                            <p className="font-medium text-stone-800">
                                {line.product?.nombre ?? "Producto"}
                                {line.variant?.nombre && <span className="text-stone-500"> ({line.variant.nombre})</span>}
                                <span className="text-stone-500"> · x{trimDecimalZeros(movement.quantity)}</span>
                            </p>
                            <p className="text-xs text-stone-400 mt-0.5">
                                {formatOrderDateTime(movement.created_at)}
                                {movement.created_by?.nombre ? ` · ${movement.created_by.nombre}` : ""}
                            </p>
                            {movement.note && <p className="text-xs text-stone-500 italic mt-0.5">"{movement.note}"</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
