export interface IPaymentMethod {
    id: number;
    name: string;
    active: boolean;
    tenant_id: number;
}

export interface IPaymentMethodTotal {
    payment_method_id: number | null;
    name: string;
    total: number;
}
