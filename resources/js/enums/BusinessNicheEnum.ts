export enum BusinessNicheEnum {
    Taqueria    = "taqueria",
    Restaurante = "restaurante",
    Cafeteria   = "cafeteria",
    Pasteleria  = "pasteleria",
    Carniceria  = "carniceria",
    BarCantina  = "bar_cantina",
    Otro        = "otro",
}

export const BUSINESS_NICHE_LABELS: Record<BusinessNicheEnum, string> = {
    [BusinessNicheEnum.Taqueria]:    "Taquería",
    [BusinessNicheEnum.Restaurante]: "Restaurante",
    [BusinessNicheEnum.Cafeteria]:   "Cafetería",
    [BusinessNicheEnum.Pasteleria]:  "Pastelería",
    [BusinessNicheEnum.Carniceria]:  "Carnicería",
    [BusinessNicheEnum.BarCantina]:  "Bar / Cantina",
    [BusinessNicheEnum.Otro]:        "Otro",
};
