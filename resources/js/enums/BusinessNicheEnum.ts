export enum BusinessNicheEnum {
    Taqueria    = "taqueria",
    Restaurante = "restaurante",
    Cafeteria   = "cafeteria",
    Pasteleria  = "pasteleria",
    Carniceria  = "carniceria",
    Cremeria    = "cremeria",
    Verduleria  = "verduleria",
    BarCantina  = "bar_cantina",
    Otro        = "otro",
}

export const BUSINESS_NICHE_LABELS: Record<BusinessNicheEnum, string> = {
    [BusinessNicheEnum.Taqueria]:    "Taquería",
    [BusinessNicheEnum.Restaurante]: "Restaurante",
    [BusinessNicheEnum.Cafeteria]:   "Cafetería",
    [BusinessNicheEnum.Pasteleria]:  "Pastelería",
    [BusinessNicheEnum.Carniceria]:  "Carnicería",
    [BusinessNicheEnum.Cremeria]:    "Cremería",
    [BusinessNicheEnum.Verduleria]:  "Verdulería",
    [BusinessNicheEnum.BarCantina]:  "Bar / Cantina",
    [BusinessNicheEnum.Otro]:        "Otro",
};
