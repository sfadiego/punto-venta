import { IOrder } from "@/models/IOrder";
import { IOrderProduct } from "@/models/IOrderProduct";
import { IReturnLineValue } from "@/models/IOrderReturnForm";
import { getOrderProductAddonsUnitTotal } from "@/utils/cartAddons";
import { calcReturnedQuantity } from "@/utils/returnCalc";

// Estimación en pantalla del reembolso de una devolución. Es un espejo de
// App\Services\OrderReturnRefundCalc y OrderReturnService (backend), que es quien manda al guardar:
// si cambia una regla allá, debe cambiar aquí.

// Tolerancia al comparar cantidades decimales (peso/volumen) al decidir si la devolución agota la línea.
const EPSILON = 0.0005;

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export interface IReturnRefundEstimate {
    /** Todo lo que se devuelve al cliente. */
    total: number;
    /** Parte que baja el saldo del cliente (venta a crédito); no sale de la caja. */
    balanceApplied: number;
    /** Parte que sale de la caja por un método de pago. */
    methodAmount: number;
}

// Lo que pagó el cliente por la línea completa: precio con extras × cantidad, con el descuento de la
// línea y luego el de la orden. Sin propina ni domicilio.
export const calcReturnLineTotal = (line: IOrderProduct, orderDiscount: number): number => {
    const unitPrice = round2(Number(line.precio) + getOrderProductAddonsUnitTotal(line));
    const subtotal = round2(unitPrice * Number(line.cantidad) * (1 - Number(line.descuento ?? 0) / 100));

    return round2(subtotal * (1 - orderDiscount / 100));
};

interface LineRefundParams {
    lineTotal: number;
    soldQuantity: number;
    quantity: number;
    returnedQuantity: number;
    refundedQuantity: number;
    refundedAmount: number;
}

// Proporcional a lo vendido; si esta devolución agota la línea y todo lo devuelto antes también se
// reembolsó, devuelve exactamente lo que falta (sin perder centavos). Nunca excede lo que queda.
export const calcReturnLineRefund = ({
    lineTotal,
    soldQuantity,
    quantity,
    returnedQuantity,
    refundedQuantity,
    refundedAmount,
}: LineRefundParams): number => {
    const remainingRefundable = Math.max(0, round2(lineTotal - refundedAmount));
    const exhaustsLine = quantity + returnedQuantity >= soldQuantity - EPSILON;
    const everythingBeforeWasRefunded = Math.abs(returnedQuantity - refundedQuantity) < EPSILON;

    if (exhaustsLine && everythingBeforeWasRefunded) return remainingRefundable;

    return Math.min(remainingRefundable, round2((lineTotal * quantity) / soldQuantity));
};

// Reembolso de las líneas marcadas. `items` está alineado por índice con `lines`. En una venta a
// crédito el reembolso baja primero el saldo del cliente, hasta lo que deba hoy.
export const calcReturnRefund = (order: IOrder, lines: IOrderProduct[], items: IReturnLineValue[]): IReturnRefundEstimate => {
    const previousItems = (order.order_returns ?? []).flatMap((orderReturn) => orderReturn.items ?? []);
    const orderDiscount = Number(order.descuento ?? 0);

    const total = round2(
        items.reduce((sum, item, index) => {
            const quantity = Number(item.quantity);
            if (!item.selected || !(quantity > 0) || !lines[index]) return sum;

            const line = lines[index];
            const refundedItems = previousItems.filter((previous) => previous.order_product_id === line.id && Number(previous.refund_amount) > 0);

            return (
                sum +
                calcReturnLineRefund({
                    lineTotal: calcReturnLineTotal(line, orderDiscount),
                    soldQuantity: Number(line.cantidad),
                    quantity,
                    returnedQuantity: calcReturnedQuantity(line),
                    refundedQuantity: refundedItems.reduce((acc, previous) => acc + Number(previous.quantity), 0),
                    refundedAmount: refundedItems.reduce((acc, previous) => acc + Number(previous.refund_amount), 0),
                })
            );
        }, 0),
    );

    const balance = order.is_credit ? Math.max(Number(order.customer?.balance ?? 0), 0) : 0;
    const balanceApplied = round2(Math.min(total, balance));

    return { total, balanceApplied, methodAmount: round2(total - balanceApplied) };
};
