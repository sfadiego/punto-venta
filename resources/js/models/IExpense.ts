export interface IExpense {
    id: number;
    sistema_id: number;
    user_id: number;
    concepto: string;
    monto: number;
    observaciones?: string | null;
    created_at: string;
    user?: { id: number; nombre: string };
}
