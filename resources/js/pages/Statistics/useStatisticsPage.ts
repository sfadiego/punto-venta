import { useState } from "react";
import { useAxios } from "@/hooks/useAxios";
import { useBestSeller, useAverageTicket } from "@/services/useStatisticsService";
import { useCurrentTotalSale } from "@/services/useOpenSalesService";
import { formatCurrency } from "@/utils/formatCurrency";

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
    const { data: averageTicket } = useAverageTicket(month);

    const totalVentas = formatCurrency(totalVentasRaw?.neto ?? 0);
    const averageTicketLabel = formatCurrency(averageTicket?.average_ticket ?? 0);

    const topProduct = bestSellers[0];

    return {
        month,
        formattedMonth: formatMonth(month),
        bestSellers,
        isLoading,
        totalVentas,
        cajaAbierta: !!sistemaId,
        handleMonthChange: (value: string) => setMonth(value),
        topProduct,
        averageTicketLabel,
        ordersCount: averageTicket?.orders_count ?? 0,
        sellByWeight: features?.sell_by_weight === true,
    };
};
