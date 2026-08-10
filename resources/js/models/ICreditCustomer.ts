export interface ICreditCustomer {
    customer: {
        id: number;
        name: string;
        phone: string | null;
        balance: number;
    };
    orders_count: number;
    total_credit: number;
}
