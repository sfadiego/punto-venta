export interface IProvider {
    id: number;
    name: string;
    phone: string | null;
    contact_name: string | null;
    notes: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface IProviderPurchase {
    id: number;
    provider_id: number;
    amount: number;
    created_by: number | null;
    note: string | null;
    created_at: string;
}
