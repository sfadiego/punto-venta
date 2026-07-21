import { useState } from "react";
import { useAxios } from "@/hooks/useAxios";
import { useBestSeller } from "@/services/useStatisticsService";
import { useCurrentTotalSale } from "@/services/useOpenSalesService";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatTotal } from "@/utils/formatUnits";

const currentMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
};

const formatMonth = (month: string) =>
    new Date(`${month}-15T12:00:00`).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
    });

export const useStatisticsPage = () => {
    const [month, setMonth] = useState<string>(currentMonth());
    const { sistemaId, features } = useAxios();

    const { data: bestSellers = [], isLoading } = useBestSeller(month);
    const { data: totalVentasRaw } = useCurrentTotalSale(sistemaId);

    const totalVentas = formatCurrency(totalVentasRaw?.neto ?? 0);

    const topProduct = bestSellers[0];
    const allSameUnit = bestSellers.length > 0 && bestSellers.every((i) => i.unidad_medida === bestSellers[0].unidad_medida);
    const totalUnits = bestSellers.reduce((sum, item) => sum + item.total, 0);
    const totalLabel = allSameUnit ? formatTotal(totalUnits, bestSellers[0].unidad_medida) : `${totalUnits}`;

    return {
        month,
        formattedMonth: formatMonth(month),
        bestSellers,
        isLoading,
        totalVentas,
        cajaAbierta: !!sistemaId,
        handleMonthChange: (value: string) => setMonth(value),
        topProduct,
        totalLabel,
        sellByWeight: features?.sell_by_weight === true,
    };
};
