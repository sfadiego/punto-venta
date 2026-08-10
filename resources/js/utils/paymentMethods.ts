import { IPaymentMethod } from "@/models/IPaymentMethod";

export const findCashPaymentMethod = (methods: IPaymentMethod[]): IPaymentMethod | null =>
    methods.find((m) => m.active && m.name.toLowerCase().includes("efectivo")) ?? null;

// Preselección al abrir un modal de cobro: "Efectivo" (método más usado); si el negocio no
// tiene uno configurado como tal, cae al primer método activo.
export const resolveDefaultPaymentMethodId = (methods: IPaymentMethod[]): number | null =>
    (findCashPaymentMethod(methods) ?? methods.find((m) => m.active))?.id ?? null;
