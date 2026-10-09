export interface ICreditCustomer {
    customer_id: number;
    // null si el registro del cliente ya no existe en la base de datos.
    customer: {
        id: number;
        name: string;
        phone: string | null;
        balance: number;
    } | null;
    orders_count: number;
    total_credit: number;
}
