import { SubscriptionPlanEnum } from "@/enums/SubscriptionPlanEnum";
import { SubscriptionStatusEnum } from "@/enums/SubscriptionStatusEnum";

export interface IPaymentInfo {
    bank: string;
    account: string;
    holder: string;
    concept: string;
}

export interface ISubscriptionDetail {
    status: SubscriptionStatusEnum;
    plan: SubscriptionPlanEnum | null;
    days_remaining: number | null;
    expires_at: string | null;
    business_name: string;
    payment_whatsapp: string | null;
    payment_info: IPaymentInfo | null;
    amount_due: number | null;
}

export interface ISubscription {
    id: number;
    plan: SubscriptionPlanEnum;
    is_lifetime: boolean;
    starts_at: string;
    expires_at: string | null;  // null para lifetime
    paid_at: string | null;
    amount: number | null;
    notes: string | null;
    status: SubscriptionStatusEnum;
    days_remaining: number | null; // null para lifetime
}

// Subconjunto de ISubscriptionDetail que viaja pegado al error de login cuando la
// suscripción del tenant está vencida/pendiente (ver AuthService::login) — el usuario está
// bloqueado y sin token, así que no puede pedir /admin/config/subscription-status aparte.
export interface ISubscriptionExpiredInfo {
    business_name: string;
    amount_due: number | null;
    payment_whatsapp: string | null;
    payment_info: IPaymentInfo | null;
}

export interface ITenantWithSubscription {
    id: number;
    business_name: string;
    slug: string;
    activo: boolean;
    is_demo: boolean;
    primary_color: string;
    users_count: number;
    subscription_plan: SubscriptionPlanEnum | null;
    subscription_expires_at: string | null;
    subscription_status: SubscriptionStatusEnum;
    days_remaining: number | null;
}
