export enum BusinessTypeEnum {
    Restaurante  = "restaurante",
    VentaPorPeso = "venta_por_peso",
    Retail       = "retail",
}

export const BUSINESS_TYPE_LABELS: Record<BusinessTypeEnum, string> = {
    [BusinessTypeEnum.Restaurante]:  "Servicio en mesa / Restaurante",
    [BusinessTypeEnum.VentaPorPeso]: "Venta por peso",
    [BusinessTypeEnum.Retail]:       "Tienda / Mostrador",
};

export interface IBusinessFeatures {
    kitchen_view:   boolean;
    order_served:   boolean;
    sell_by_weight: boolean;
    show_delivery:  boolean;
    show_extras:    boolean;
    is_retail:      boolean;
}
