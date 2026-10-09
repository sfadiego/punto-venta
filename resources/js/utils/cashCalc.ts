import { IPaymentMethodTotal } from "@/services/useOpenSalesService";
import { calcEfectivoCierre } from "@/utils/deliveryCalc";
import { isCashMethodName } from "@/utils/paymentMethods";

interface CashOnHandParams {
    efectivoInicio: number;
    byPaymentMethod: IPaymentMethodTotal[];
    domicilios: number;
    gastos: number;
    sellByWeight: boolean;
}

/**
 * Efectivo que debería haber en la caja ahora mismo: el inicial más lo cobrado en efectivo (incluidos
 * los abonos de apartados y descontados sus reembolsos, que ya vienen en by_payment_method), menos
 * domicilios y gastos. Misma fórmula que el cierre de caja (useCloseSalesSummary).
 */
export const calcCashOnHand = ({ efectivoInicio, byPaymentMethod, domicilios, gastos, sellByWeight }: CashOnHandParams): number => {
    const cashMethods = byPaymentMethod.filter((method) => isCashMethodName(method.name));
    const totalEfectivoPagado = cashMethods.reduce((sum, method) => sum + method.total, 0);
    const totalPropinaEfectivo = cashMethods.reduce((sum, method) => sum + method.propina, 0);

    return calcEfectivoCierre(efectivoInicio, totalEfectivoPagado, sellByWeight ? 0 : totalPropinaEfectivo, domicilios, gastos);
};
