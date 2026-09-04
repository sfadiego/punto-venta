export enum ClientLeadStatusEnum {
    FollowUp  = "follow_up",
    Customer  = "customer",
    Discarded = "discarded",
}

export const CLIENT_LEAD_STATUS_LABELS: Record<ClientLeadStatusEnum, string> = {
    [ClientLeadStatusEnum.FollowUp]:  "Seguimiento",
    [ClientLeadStatusEnum.Customer]:  "Cliente",
    [ClientLeadStatusEnum.Discarded]: "Descartado",
};
