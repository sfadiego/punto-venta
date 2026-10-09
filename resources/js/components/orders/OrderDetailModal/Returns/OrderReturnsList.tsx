import { Undo2 } from "lucide-react";
import { IOrderProduct } from "@/models/IOrderProduct";
import { IOrderReturn } from "@/models/IOrderReturn";
import { trimDecimalZeros } from "@/utils/formatDecimal";
import { formatOrderDateTime } from "@/utils/dateUtils";
import { describeReturnRefund, groupOrderReturns } from "@/utils/groupOrderReturns";
import { PrintTicketButton } from "@/components/orders/PrintTicket/PrintTicketButton";
import { ReturnReasonBadge } from "./ReturnReasonBadge";

interface OrderReturnsListProps {
    orderProducts: IOrderProduct[];
    orderReturns?: IOrderReturn[];
}

// Solo se renderiza cuando la orden tiene al menos una devolución (order.has_return) — una tarjeta
// por devolución con su motivo, usuario, nota y las líneas devueltas, la más reciente primero.
// Compacto a propósito: es información secundaria dentro de un modal ya lleno (productos + totales).
export const OrderReturnsList = ({ orderProducts, orderReturns = [] }: OrderReturnsListProps) => {
    const groups = groupOrderReturns(orderProducts, orderReturns);

    if (groups.length === 0) return null;

    return (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1">
                <Undo2 size={12} />
                Devoluciones
            </div>
            <div className="divide-y divide-amber-200/60">
                {groups.map(({ key, orderReturn, lines, createdAt }) => (
                    <div key={key} className="py-1.5 text-xs text-stone-600 leading-snug">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-stone-500">
                            {orderReturn && <ReturnReasonBadge reason={orderReturn.reason} />}
                            <span>{formatOrderDateTime(createdAt)}</span>
                            {orderReturn?.created_by?.nombre && <span>· {orderReturn.created_by.nombre}</span>}
                            {orderReturn && (
                                <span className="ml-auto">
                                    <PrintTicketButton orderId={orderReturn.order_id} returnId={orderReturn.id} />
                                </span>
                            )}
                        </div>
                        {lines.map(({ movement, line }) => (
                            <div key={movement.id}>
                                <span className="font-medium text-stone-800">
                                    {line.product?.nombre ?? "Producto"}
                                    {line.variant?.nombre && ` (${line.variant.nombre})`}
                                </span>
                                {" · x"}{trimDecimalZeros(movement.quantity)}
                            </div>
                        ))}
                        {orderReturn && <p className="text-stone-500">{describeReturnRefund(orderReturn)}</p>}
                        {orderReturn?.note && <p className="italic text-stone-400">"{orderReturn.note}"</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};
