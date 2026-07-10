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
    [SubscriptionPlanEnum.Lifetime]: "Membresía indefinida",
};
