import { useGetActiveSale, useCurrentTotalSale } from "@/services/useOpenSalesService";
import { calcEfectivoCierre } from "@/utils/deliveryCalc";
import { useAxios } from "@/hooks/useAxios";

export const useCloseSalesSummary = () => {
    const { features, branchId } = useAxios();
    const sellByWeight = features?.sell_by_weight === true;

    // Sin branchId, getActiveSale() resuelve la PRIMERA caja abierta del tenant sin
    // importar sucursal — con 2+ sucursales activas, el usuario podría terminar cerrando
    // la caja de una sucursal ajena a la que tiene seleccionada. Ver mismo fix en
    // useAppLayout.ts.
    const { data: activeSale, isLoading: loadingSale } = useGetActiveSale(branchId);
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
