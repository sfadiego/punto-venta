import { LayawayPaymentTypeEnum } from "@/enums/LayawayPaymentTypeEnum";
import { IPaymentMethod } from "./IPaymentMethod";

export interface ILayawayPayment {
    id: number;
    order_id: number;
    customer_id: number;
    type: LayawayPaymentTypeEnum;
    amount: number;
    payment_method_id: number | null;
    payment_method?: Pick<IPaymentMethod, "id" | "name"> | null;
    sistema_id: number | null;
    created_by: number | null;
    note: string | null;
    created_at: string;
}

// Payload de POST /order/{id}/layaway — el anticipo mínimo y la fecha límite por defecto los
// resuelve el backend con la configuración del negocio (layaway_min_percent / layaway_days).
export interface ILayawayStorePayload {
    customer_id: number;
    amount: number;
    payment_method_id: number;
    sistema_id: number;
    due_date?: string;
    note?: string;
}

// Payload de POST /order/{id}/layaway/payment — abono; si cubre el saldo, el backend liquida y
// cierra la venta.
export interface ILayawayPaymentPayload {
    amount: number;
    payment_method_id: number;
    sistema_id: number;
    note?: string;
}

// Payload de POST /order/{id}/layaway/cancel — devuelve el stock y reembolsa lo abonado desde la
// caja indicada (método opcional: por defecto el del último abono).
export interface ILayawayCancelPayload {
    sistema_id: number;
    payment_method_id?: number;
    // Parte de lo abonado que el negocio retiene (0 o ausente = reembolso total).
    retained_amount?: number;
    note?: string;
}

// GET /order/layaways/summary — tarjetas del tab Apartados.
export interface ILayawayListSummary {
    active_count: number;
    pending_balance: number;
    overdue_count: number;
    due_soon_count: number;
}
