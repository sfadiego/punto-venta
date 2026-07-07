import { useState } from "react";
import { useAxios } from "@/hooks/useAxios";
import { useSalesByCategory } from "@/services/useSalesByCategoryService";
import { useCurrentTotalSale } from "@/services/useOpenSalesService";

export const useSalesByCategoryModal = (fecha?: string | null) => {
    const { sistemaId } = useAxios();
    const [isOpen, setIsOpen] = useState(false);

    const { data, isLoading } = useSalesByCategory(isOpen ? sistemaId : null, fecha);
    const { data: totales } = useCurrentTotalSale(isOpen ? sistemaId : null);

    const totalBruto      = data?.reduce((sum, cat) => sum + cat.total_revenue, 0) ?? 0;
    const totalDomicilios = totales?.domicilios ?? 0;
    const totalNeto       = totales?.neto       ?? 0;

    return {
        isOpen,
        open:  () => setIsOpen(true),
        close: () => setIsOpen(false),
        data:  data ?? [],
        isLoading,
        totalBruto,
        totalDomicilios,
        totalNeto,
        sistemaId,
    };
};
