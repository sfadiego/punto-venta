import { useGetActiveSale, useCurrentTotalSale } from "@/services/useOpenSalesService";
import { calcEfectivoCierre } from "@/utils/deliveryCalc";
import { useAxios } from "@/hooks/useAxios";

export const useCloseSalesSummary = () => {
    const { features } = useAxios();
    const sellByWeight = features?.sell_by_weight === true;

    const { data: activeSale, isLoading: loadingSale } = useGetActiveSale();
    const sistemaId = activeSale?.id ?? null;

    const { data: totales, isLoading: loadingTotal } = useCurrentTotalSale(sistemaId ?? 0);

    const efectivoInicio      = activeSale?.efectivo_caja_inicio ?? 0;
    const totalBruto          = totales?.bruto      ?? 0;
    const totalDomicilios     = totales?.domicilios ?? 0;
    const totalNeto           = totales?.neto       ?? 0;
    const totalPropinas       = totales?.propinas   ?? 0;
    const totalGastos         = totales?.gastos     ?? 0;
    const byPaymentMethod     = totales?.by_payment_method ?? [];

    const totalEfectivoPagado     = byPaymentMethod
        .filter((m) => m.name.toLowerCase().includes("efectivo"))
        .reduce((sum, m) => sum + m.total, 0);

    const totalTransferenciaPagado = byPaymentMethod
        .filter((m) => !m.name.toLowerCase().includes("efectivo"))
        .reduce((sum, m) => sum + m.total, 0);

    const totalPropinasTarjeta = byPaymentMethod
        .filter((m) => !m.name.toLowerCase().includes("efectivo"))
        .reduce((sum, m) => sum + m.propina, 0);

    const totalPropinaEfectivo = byPaymentMethod
        .filter((m) => m.name.toLowerCase().includes("efectivo"))
        .reduce((sum, m) => sum + m.propina, 0);

    const efectivoCierre = calcEfectivoCierre(
        efectivoInicio,
        totalEfectivoPagado,
        sellByWeight ? 0 : totalPropinaEfectivo,
        totalDomicilios,
        totalGastos,
    );

    return {
        activeSale,
        sistemaId,
        efectivoInicio,
        totalBruto,
        totalDomicilios,
        totalNeto,
        totalGastos,
        efectivoCierre,
        totalEfectivoPagado,
        totalTransferenciaPagado,
        totalPropinas,
        totalPropinasTarjeta,
        totalPropinaEfectivo,
        byPaymentMethod,
        sellByWeight,
        isLoading: loadingSale || loadingTotal,
    };
};
