import { RoleEnum } from "@/enums/RoleEnum";

export interface IUser {
    id: number;
    tenant_id: number;
    nombre: string;
    apellido_materno: string;
    apellido_paterno: string;
    rol_id: number;
    role?: RoleEnum;
    activo: number;
    email: string;
    usuario: string;
    created_at: string;
    updated_at: string;
}

export interface ICreateUserPayload {
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email: string;
    usuario: string;
    password: string;
    rol_id: number;
    activo: boolean;
    // Solo aplica a roles distintos de Admin — Admin siempre tiene acceso a todas las
    // sucursales sin necesidad de asignación explícita.
    branch_ids?: number[];
}

export interface IUpdateUserPayload {
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email: string;
    usuario: string;
    password?: string;
    rol_id: number;
    activo: boolean;
}
