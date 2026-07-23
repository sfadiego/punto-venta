import { BusinessNicheEnum } from "@/enums/BusinessNicheEnum";
import { DemoRequestStatusEnum } from "@/enums/DemoRequestStatusEnum";

export interface IDemoRequest {
    id: number;
    business_name: string;
    email: string;
    phone: string;
    business_niche: BusinessNicheEnum;
    status: DemoRequestStatusEnum;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface ICreateDemoRequestPayload {
    business_name: string;
    email: string;
    phone: string;
    business_niche: BusinessNicheEnum;
}

export interface IUpdateDemoRequestPayload {
    status: DemoRequestStatusEnum;
    notes?: string | null;
}
