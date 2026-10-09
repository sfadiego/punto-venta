import { ReturnReasonEnum } from "@/enums/ReturnReasonEnum";

// Línea de una devolución con lo que se reembolsó por ella (cero = solo regresó al stock).
export interface IOrderReturnItem {
    id: number;
    order_return_id: number;
    order_product_id: number;
    quantity: number;
    refund_amount: number;
}

// Devolución de una orden cerrada (retail): agrupa varias líneas bajo un motivo. Las líneas y
// cantidades de stock se leen de los movimientos de cada order_product (order_return_id).
export interface IOrderReturn {
    id: number;
    order_id: number;
    reason: ReturnReasonEnum;
    note: string | null;
    created_at: string;
    created_by?: { id: number; nombre: string } | null;
    // Dinero devuelto al cliente: total, la parte que bajó su saldo de crédito y el resto, que salió
    // de la caja por `refund_payment_method`. Cero = devolución solo de stock.
    refund_amount: number;
    balance_applied: number;
    refund_payment_method_id: number | null;
    refund_payment_method?: { id: number; name: string } | null;
    items?: IOrderReturnItem[];
}

export interface IOrderReturnPayload {
    reason: ReturnReasonEnum;
    note?: string;
    // Falso = devolución solo de stock. El método solo se envía cuando parte del dinero sale por método de pago.
    refund: boolean;
    refund_payment_method_id?: number;
    items: { order_product_id: number; quantity: number }[];
}
