import { useState } from "react";
import { useAxios } from "@/hooks/useAxios";
import { useSalesByCategory } from "@/services/useSalesByCategoryService";

export const useSalesByCategoryModal = (fecha?: string | null, mes?: string | null, semana?: string | null) => {
    const { sistemaId } = useAxios();
    const [isOpen, setIsOpen] = useState(false);

    // Con fecha, semana o mes (vista histórica de SalesPage): agrega todas las sesiones de ese
    // período, sin importar cuál sea la sesión activa en este navegador. Sin ninguno
    // (CloseSales): se acota a la sesión actual.
    const scopedSistemaId = fecha || semana || mes ? null : sistemaId;

    const { data, isLoading, isError } = useSalesByCategory(
        isOpen ? scopedSistemaId : null,
        isOpen ? fecha : null,
        isOpen ? mes : null,
        isOpen ? semana : null,
    );

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
        semana: isOpen ? semana : null,
        mes: isOpen ? mes : null,
    };
};
