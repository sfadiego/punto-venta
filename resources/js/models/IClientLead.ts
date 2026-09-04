import { BusinessNicheEnum } from "@/enums/BusinessNicheEnum";
import { ClientLeadStatusEnum } from "@/enums/ClientLeadStatusEnum";

export interface IClientLead {
    id: number;
    business_name: string;
    email: string;
    phone: string;
    business_niche: BusinessNicheEnum;
    status: ClientLeadStatusEnum;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

// Público — payload del formulario "Solicitar demo" (AuthPage/DemoRequestForm)
export interface ICreateDemoRequestPayload {
    business_name: string;
    email: string;
    phone: string;
    business_niche: BusinessNicheEnum;
}

// Super-admin — alta manual de un cliente potencial
export interface IClientLeadCreatePayload {
    business_name: string;
    email: string;
    phone: string;
    business_niche: BusinessNicheEnum;
    status?: ClientLeadStatusEnum;
    notes?: string | null;
}

export interface IUpdateClientLeadPayload {
    status: ClientLeadStatusEnum;
    notes?: string | null;
}
