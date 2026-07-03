export enum BusinessTypeEnum {
    Restaurante  = "restaurante",
    VentaPorPeso = "venta_por_peso",
}

export const BUSINESS_TYPE_LABELS: Record<BusinessTypeEnum, string> = {
    [BusinessTypeEnum.Restaurante]:  "Servicio en mesa / mostrador",
    [BusinessTypeEnum.VentaPorPeso]: "Venta por peso",
};

export interface IBusinessFeatures {
    kitchen_view:   boolean;
    order_served:   boolean;
    sell_by_weight: boolean;
}
