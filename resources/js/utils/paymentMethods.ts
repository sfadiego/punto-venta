import { IPaymentMethod } from "@/models/IPaymentMethod";
import { ICustomer } from "@/models/ICustomer";

export const findCashPaymentMethod = (methods: IPaymentMethod[]): IPaymentMethod | null =>
    methods.find((m) => m.active && m.name.toLowerCase().includes("efectivo")) ?? null;

// Preselección al abrir un modal de cobro: "Efectivo" (método más usado); si el negocio no
// tiene uno configurado como tal, cae al primer método activo.
export const resolveDefaultPaymentMethodId = (methods: IPaymentMethod[]): number | null =>
    (findCashPaymentMethod(methods) ?? methods.find((m) => m.active))?.id ?? null;

interface CanPayOrderParams {
    isCreditMode: boolean;
    isCash: boolean;
    total: number;
    cashNum: number;
    selectedCustomer: ICustomer | null;
}

// Habilita el botón de cobrar según el modo de pago: crédito requiere cliente habilitado,
// efectivo requiere que el monto recibido alcance, cualquier otro método solo requiere total > 0.
// Usado por usePayOrder, useSaleQuickPay y usePayModal (mismo cálculo, tres flujos de cobro).
export const canPayOrder = ({ isCreditMode, isCash, total, cashNum, selectedCustomer }: CanPayOrderParams): boolean => {
    if (isCreditMode) return total > 0 && !!selectedCustomer && selectedCustomer.allow_credit;
    if (isCash) return cashNum >= total && total > 0;
    return total > 0;
};
