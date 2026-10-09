import { useGetActiveSale, useCurrentTotalSale } from "@/services/useOpenSalesService";
import { calcEfectivoCierre } from "@/utils/deliveryCalc";
import { useAxios } from "@/hooks/useAxios";

export const useCloseSalesSummary = () => {
    const { features, branchId } = useAxios();
    const sellByWeight = features?.sell_by_weight === true;
    // `features` guardadas antes de show_delivery no traen la clave — siguen viendo el domicilio.
    const showDelivery = features?.show_delivery !== false;
    // Los apartados son exclusivos de retail.
    const isRetail = features?.is_retail === true;

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
    const layawaySummary      = totales?.apartados ?? { abonos: 0, reembolsos: 0, neto: 0 };
    const returnsSummary      = totales?.devoluciones ?? { total: 0, balance_applied: 0, cash_out: 0, count: 0 };

    // Sesión sin ventas, abonos/reembolsos de apartados ni devoluciones: se cierra con motivo (ver CloseSalesEmptySessionNotice).
    const isEmptySession          = totalBruto === 0 && layawaySummary.abonos === 0 && layawaySummary.reembolsos === 0 && returnsSummary.count === 0;

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
        layawaySummary,
        returnsSummary,
        isEmptySession,
        sellByWeight,
        showDelivery,
        isRetail,
        isLoading: loadingSale || loadingTotal,
    };
};
