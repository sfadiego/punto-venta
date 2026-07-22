import { useState } from "react";
import { useAxios } from "@/hooks/useAxios";
import { useSalesByCategory } from "@/services/useSalesByCategoryService";

export const useSalesByCategoryModal = (fecha?: string | null) => {
    const { sistemaId } = useAxios();
    const [isOpen, setIsOpen] = useState(false);

    // Con fecha (vista histórica de SalesPage): agrega todas las sesiones de ese día,
    // sin importar cuál sea la sesión activa en este navegador. Sin fecha (CloseSales):
    // se acota a la sesión actual.
    const scopedSistemaId = fecha ? null : sistemaId;

    const { data, isLoading, isError } = useSalesByCategory(isOpen ? scopedSistemaId : null, isOpen ? fecha : null);

    const categories = data?.categories ?? [];
    const totalBruto = categories.reduce((sum, cat) => sum + cat.total_revenue, 0);
    const totalDomicilios = data?.domicilios ?? 0;
    const totalNeto = totalBruto - totalDomicilios;

    return {
        isOpen,
        open:  () => setIsOpen(true),
        close: () => setIsOpen(false),
        data:  categories,
        isLoading,
        isError,
        totalBruto,
        totalDomicilios,
        totalNeto,
        sistemaId: scopedSistemaId,
        fecha: isOpen ? fecha : null,
    };
};
