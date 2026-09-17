export interface IBranch {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface IBranchListItem {
    id: number;
    name: string;
    address: string | null;
}

export interface IBranchFormPayload {
    name: string;
    address?: string | null;
    phone?: string | null;
    active?: boolean;
}

export interface IBranchUserSummary {
    id: number;
    nombre: string;
    apellido_paterno: string;
    email: string;
}

export interface IBranchDetail extends IBranch {
    users?: IBranchUserSummary[];
}

export interface IUserBranches {
    is_admin: boolean;
    branch_ids: number[];
}

export interface ISyncBranchUsersPayload {
    user_ids: number[];
}
