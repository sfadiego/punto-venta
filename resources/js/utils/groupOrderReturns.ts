import { IOrderProduct } from "@/models/IOrderProduct";
import { IOrderReturn } from "@/models/IOrderReturn";
import { IStockMovement } from "@/models/IStockMovement";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";

export interface IReturnGroupLine {
    movement: IStockMovement;
    line: IOrderProduct;
}

export interface IReturnGroup {
    key: string;
    /** Registro de la devolución; null en las anteriores al registro (sin motivo ni usuario agrupados). */
    orderReturn: IOrderReturn | null;
    lines: IReturnGroupLine[];
    createdAt: string;
}

// Agrupa los movimientos de devolución de las líneas por devolución, la más reciente primero. Un
// movimiento sin order_return_id (devolución anterior al registro) forma su propio grupo.
export const groupOrderReturns = (orderProducts: IOrderProduct[], orderReturns: IOrderReturn[]): IReturnGroup[] => {
    const returnsById = new Map(orderReturns.map((orderReturn) => [orderReturn.id, orderReturn]));
    const groups = new Map<string, IReturnGroup>();

    orderProducts
        .flatMap((line) => (line.stock_movements ?? []).map((movement) => ({ movement, line })))
        .forEach(({ movement, line }) => {
            const orderReturn = movement.order_return_id ? (returnsById.get(movement.order_return_id) ?? null) : null;
            const key = movement.order_return_id ? `return-${movement.order_return_id}` : `legacy-${movement.id}`;
            const group = groups.get(key) ?? { key, orderReturn, lines: [], createdAt: orderReturn?.created_at ?? movement.created_at };
            group.lines.push({ movement, line });
            groups.set(key, group);
        });

    return [...groups.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
};

// Qué pasó con el dinero de una devolución: lo reembolsado y por dónde salió (método de pago y/o saldo
// del cliente en una venta a crédito), o que fue solo de stock.
export const describeReturnRefund = (orderReturn: IOrderReturn): string => {
    if (!(orderReturn.refund_amount > 0)) return "Sin reembolso";

    const parts: string[] = [];
    const methodAmount = orderReturn.refund_amount - orderReturn.balance_applied;
    if (methodAmount > 0.005) {
        parts.push(`${formatCurrencyTrimmed(methodAmount)}${orderReturn.refund_payment_method ? ` en ${orderReturn.refund_payment_method.name}` : ""}`);
    }
    if (orderReturn.balance_applied > 0) parts.push(`${formatCurrencyTrimmed(orderReturn.balance_applied)} del saldo del cliente`);

    return `Reembolso ${formatCurrencyTrimmed(orderReturn.refund_amount)} · ${parts.join(" + ")}`;
};
