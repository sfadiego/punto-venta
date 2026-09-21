export interface IDashboardTenantCounts {
    active: number;
    demo: number;
    inactive: number;
}

export interface IDashboardErrorCounts {
    total: number;
    backend: number;
    frontend: number;
}

export interface IDashboardRecentError {
    source: string;
    status_code: number | null;
    error_message: string | null;
    tenant_slug: string | null;
    created_at: string;
}

export interface IDashboardExpiringSubscription {
    id: number;
    business_name: string;
    slug: string;
    subscription_plan: string | null;
    subscription_amount: number | null;
    subscription_expires_at: string | null;
    days_remaining: number | null;
}

export interface IDashboardStaleTenant {
    id: number;
    business_name: string;
    slug: string;
    last_activity_at: string | null;
}

export interface IDashboardClientLeads {
    follow_up: number;
    customer: number;
    discarded: number;
}

export interface IDashboardFeatureAdoption {
    multi_branch: number;
    printer: number;
    stock: number;
    customers: number;
}

export interface IDashboardSummary {
    tenants: IDashboardTenantCounts;
    active_users_now: number;
    mrr: number;
    errors_last_24h: IDashboardErrorCounts;
    recent_errors: IDashboardRecentError[];
    expiring_subscriptions: IDashboardExpiringSubscription[];
    stale_tenants: IDashboardStaleTenant[];
    client_leads: IDashboardClientLeads;
    feature_adoption: IDashboardFeatureAdoption;
}
