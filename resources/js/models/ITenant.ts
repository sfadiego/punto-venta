import { BusinessTypeEnum, IBusinessFeatures } from "@/enums/BusinessTypeEnum";

export interface ITenant {
    id: number;
    slug: string;
    activo: boolean;
    business_name: string;
    primary_color: string;
    sidebar_color: string;
    font_color: string;
    label_color: string;
    logo_path: string | null;
    logo_icon: string | null;
    tipo_negocio: BusinessTypeEnum;
    printer_enabled: boolean;
    features?: IBusinessFeatures;
    users_count?: number;
    active_users_count?: number;
    subscription_plan?: string | null;
    subscription_amount?: number | null;
    max_users?: number | null;
    effective_max_users?: number;
    plan_default_max_users?: number | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface ICreateTenantPayload {
    slug: string;
    business_name: string;
    primary_color: string;
    sidebar_color: string;
    font_color: string;
    label_color: string;
    tipo_negocio: BusinessTypeEnum;
    admin_nombre: string;
    admin_apellido: string;
    admin_email: string;
    admin_usuario: string;
    admin_password: string;
}

export interface IUpdateTenantPayload {
    slug: string;
    activo?: boolean;
    business_name: string;
    primary_color: string;
    sidebar_color: string;
    font_color: string;
    label_color: string;
    logo_icon: string | null;
    tipo_negocio: BusinessTypeEnum;
    printer_enabled: boolean;
    max_users?: number | null;
    subscription_amount?: number | null;
}

