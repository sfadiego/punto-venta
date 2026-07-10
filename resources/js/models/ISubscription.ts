import { SubscriptionPlanEnum } from "@/enums/SubscriptionPlanEnum";
import { SubscriptionStatusEnum } from "@/enums/SubscriptionStatusEnum";

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

export interface ITenantWithSubscription {
    id: number;
    business_name: string;
    slug: string;
    activo: boolean;
    primary_color: string;
    users_count: number;
    subscription_plan: SubscriptionPlanEnum | null;
    subscription_expires_at: string | null;
    subscription_status: SubscriptionStatusEnum;
    days_remaining: number | null;
}
