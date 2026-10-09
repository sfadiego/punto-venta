import { useAxios } from "@/hooks/useAxios";
import { useCustomerDebtSummary } from "@/services/useCustomerService";
import { useCustomersFilters } from "./useCustomersFilters";
import { useCustomersList } from "./useCustomersList";
import { useCustomerModals } from "./useCustomerModals";

// Hook principal de la página de Clientes: compone filtros, listado, modales y el resumen del adeudo.
export const useCustomersPage = () => {
    const { features } = useAxios();
    const filters = useCustomersFilters();
    const list = useCustomersList(filters);
    const modals = useCustomerModals();
    const { data: debtSummary } = useCustomerDebtSummary();

    return {
        filters,
        list,
        modals,
        debtSummary,
        // Los apartados son exclusivos de retail.
        showLayaways: features?.is_retail === true,
    };
};
