export enum UnidadMedidaEnum {
    Unidad = "unidad",
    Kg     = "kg",
    Gr     = "gr",
}

export const UNIDAD_LABELS: Record<UnidadMedidaEnum, string> = {
    [UnidadMedidaEnum.Unidad]: "und",
    [UnidadMedidaEnum.Kg]:     "kg",
    [UnidadMedidaEnum.Gr]:     "gr",
};
