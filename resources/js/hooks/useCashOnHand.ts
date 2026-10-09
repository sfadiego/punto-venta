import { useAxios } from "@/hooks/useAxios";
import { useCurrentTotalSale, useGetActiveSale } from "@/services/useOpenSalesService";
import { calcCashOnHand } from "@/utils/cashCalc";

// Efectivo esperado en la caja abierta de la sucursal activa (null mientras carga o sin caja abierta).
// Usado para avisar antes de un reembolso en efectivo que dejaría la caja en negativo.
export const useCashOnHand = () => {
    const { features, branchId } = useAxios();
    const { data: activeSale } = useGetActiveSale(branchId);
    const { data: totals } = useCurrentTotalSale(activeSale?.id ?? 0);

    if (!activeSale || !totals) return { cashOnHand: null };

    return {
        cashOnHand: calcCashOnHand({
            efectivoInicio: activeSale.efectivo_caja_inicio ?? 0,
            byPaymentMethod: totals.by_payment_method ?? [],
            domicilios: totals.domicilios ?? 0,
            gastos: totals.gastos ?? 0,
            sellByWeight: features?.sell_by_weight === true,
        }),
    };
};
