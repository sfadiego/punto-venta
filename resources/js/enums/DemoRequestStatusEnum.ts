export enum DemoRequestStatusEnum {
    Pending    = "pending",
    Contacted  = "contacted",
    Converted  = "converted",
    Discarded  = "discarded",
}

export const DEMO_REQUEST_STATUS_LABELS: Record<DemoRequestStatusEnum, string> = {
    [DemoRequestStatusEnum.Pending]:   "Pendiente",
    [DemoRequestStatusEnum.Contacted]: "Contactado",
    [DemoRequestStatusEnum.Converted]: "Convertido",
    [DemoRequestStatusEnum.Discarded]: "Descartado",
};
