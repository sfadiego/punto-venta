export type SalaryPeriod = "daily" | "weekly" | "weekend" | "biweekly" | "monthly";

export type WorkDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface IEmployee {
    id: number;
    name: string;
    phone: string | null;
    salary: number;
    salary_period: SalaryPeriod;
    work_days: WorkDay[];
    active: boolean;
    created_at?: string;
    updated_at?: string;
}
