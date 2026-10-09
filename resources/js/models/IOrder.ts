import { IOrderStatus } from "./IOrderStatus";
import { IOrderProduct } from "./IOrderProduct";
import { IPaymentMethod } from "./IPaymentMethod";
import { ICustomer } from "./ICustomer";
import { ILayawayPayment } from "./ILayaway";
import { IOrderReturn } from "./IOrderReturn";

export interface IOrder {
    id: number;
    total: number;
    subtotal: number;
    descuento: number;
    nombre_pedido: string;
    estatus_pedido_id: number;
    sistema_id: number;
    costo_domicilio: number | string;
    created_at: string;
    updated_at: string;
    status: IOrderStatus;
    order_products?: IOrderProduct[];
    is_delivery: boolean;
    delivery_address: string | null;
    delivery_reference: string | null;
    payment_method_id: number | null;
    payment_method?: Pick<IPaymentMethod, "id" | "name"> | null;
    propina: number;
    customer_id: number | null;
    is_credit: boolean;
    credit_applied_at: string | null;
    customer?: Pick<ICustomer, "id" | "name" | "balance" | "phone"> | null;
    // Apartados (retail): total abonado y fecha límite (YYYY-MM-DD). Cero/null en ventas normales.
    amount_paid: number;
    layaway_due_date: string | null;
    // Cuándo se concretó la venta (cerrada o liquidada) — base del plazo de devolución. Null en ventas sin cerrar.
    closed_at?: string | null;
    layaway_payments?: ILayawayPayment[];
    // Solo en el listado de apartados cancelados (layaways_only): sumas por tipo de movimiento.
    layaway_deposited?: number | string | null;
    layaway_refunded?: number | string | null;
    layaway_retained?: number | string | null;
    // Calculado al vuelo contra stock_movements (OrderService::makeQuery) — true si alguna
    // línea de la orden tiene al menos una devolución registrada.
    has_return?: boolean;
    // Devoluciones con su motivo — solo en el detalle de la orden (GET /order/{id}), no en el listado.
    order_returns?: IOrderReturn[];
}

// Respuesta ligera de GET /order/closed-list — combobox de devolución (Inventario). No trae
// order_products ni el resto de relaciones de IOrder; la línea a devolver se carga aparte con
// useShowOrder una vez elegida la orden.
export interface IOrderSummary {
    id: number;
    nombre_pedido: string;
    total: number;
    created_at: string;
    customer_id: number | null;
    customer?: Pick<ICustomer, "id" | "name"> | null;
}
