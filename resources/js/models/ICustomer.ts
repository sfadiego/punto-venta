import { ReturnReasonEnum } from "@/enums/ReturnReasonEnum";
import { IOrder } from "./IOrder";

export interface ICustomer {
    id: number;
    name: string;
    phone: string | null;
    notes: string | null;
    address: string | null;
    delivery_reference: string | null;
    allow_credit: boolean;
    balance: number;
    // Apartados activos (solo listado de Clientes): cantidad y totales — el saldo pendiente es
    // layaway_total - layaway_paid. Independiente del adeudo (balance).
    layaway_count?: number;
    layaway_total?: number | null;
    layaway_paid?: number | null;
    // Apartados activos con la fecha límite ya vencida (solo listado de Clientes).
    layaway_overdue_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface ICustomerPayment {
    id: number;
    customer_id: number;
    amount: number;
    created_by: number | null;
    note: string | null;
    created_at: string;
}

export interface ICustomerCharge {
    id: number;
    customer_id: number;
    amount: number;
    created_by: number | null;
    note: string | null;
    created_at: string;
}

// Devolución de una venta a crédito que bajó el saldo del cliente (parte del reembolso aplicada al
// adeudo). No es un abono: se muestra aparte en el historial.
export interface ICustomerBalanceReturn {
    id: number;
    order_id: number;
    reason: ReturnReasonEnum;
    balance_applied: number;
    created_at: string;
}

export interface ICustomerDetail extends ICustomer {
    credit_orders?: IOrder[];
    payments?: ICustomerPayment[];
    charges?: ICustomerCharge[];
    balance_returns?: ICustomerBalanceReturn[];
    // Apartados del cliente (activos, liquidados y cancelados), cada uno con su historial de abonos.
    layaway_orders?: IOrder[];
}

export interface ICustomerFormPayload {
    name: string;
    phone?: string | null;
    notes?: string | null;
    address?: string | null;
    delivery_reference?: string | null;
    allow_credit?: boolean;
}
