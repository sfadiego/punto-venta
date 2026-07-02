import { useState } from "react";
import { useAxios } from "@/hooks/useAxios";
import { useBestSeller } from "@/services/useStatisticsService";
import { useCurrentTotalSale } from "@/services/useOpenSalesService";

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

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

export const useStatisticsPage = () => {
    const [month, setMonth] = useState<string>(currentMonth());
    const { sistemaId } = useAxios();

    const { data: bestSellers = [], isLoading } = useBestSeller(month);
    const { data: totalVentasRaw } = useCurrentTotalSale(sistemaId);

    const totalVentas = formatCurrency(totalVentasRaw?.neto ?? 0);

    return {
        month,
        formattedMonth: formatMonth(month),
        bestSellers,
        isLoading,
        totalVentas,
        cajaAbierta: !!sistemaId,
        handleMonthChange: (value: string) => setMonth(value),
    };
};
