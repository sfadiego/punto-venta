import { IOrder } from "./IOrder";

export interface ICustomer {
    id: number;
    name: string;
    phone: string | null;
    notes: string | null;
    allow_credit: boolean;
    balance: number;
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

export interface ICustomerDetail extends ICustomer {
    credit_orders?: IOrder[];
    payments?: ICustomerPayment[];
}

export interface ICustomerFormPayload {
    name: string;
    phone?: string | null;
    notes?: string | null;
    allow_credit?: boolean;
}
