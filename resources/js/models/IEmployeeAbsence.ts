export interface IEmployeeAbsence {
    id: number;
    employee_id: number;
    date: string;
    notified: boolean;
    deduction_amount: number | null;
    notes: string | null;
    created_at?: string;
    updated_at?: string;
}
