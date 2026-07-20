export enum SubscriptionPlanEnum {
    Weekly    = "weekly",
    Biweekly  = "biweekly",
    Monthly   = "monthly",
    Biannual  = "biannual",
    Annual    = "annual",
    Lifetime  = "lifetime",
}

export const PLAN_LABELS: Record<SubscriptionPlanEnum, string> = {
    [SubscriptionPlanEnum.Weekly]:    "Semanal",
    [SubscriptionPlanEnum.Biweekly]:  "Quincenal",
    [SubscriptionPlanEnum.Monthly]:   "Mensual",
    [SubscriptionPlanEnum.Biannual]:  "Semestral",
    [SubscriptionPlanEnum.Annual]:    "Anual",
    [SubscriptionPlanEnum.Lifetime]:  "Membresía indefinida",
};

export const PLAN_MAX_USERS: Record<SubscriptionPlanEnum, number> = {
    [SubscriptionPlanEnum.Weekly]:    2,
    [SubscriptionPlanEnum.Biweekly]:  2,
    [SubscriptionPlanEnum.Monthly]:   4,
    [SubscriptionPlanEnum.Biannual]:  4,
    [SubscriptionPlanEnum.Annual]:    5,
    [SubscriptionPlanEnum.Lifetime]:  10,
};
