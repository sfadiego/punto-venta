import { useIndexCustomersPaginated } from "@/services/useCustomerService";
import { useServerTable } from "@/hooks/useServerTable";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { CustomersFilters } from "./useCustomersFilters";

// Listado paginado de clientes según los filtros activos. Cambiar un filtro vuelve a la primera página.
export const useCustomersList = (filters: CustomersFilters) => {
    const { search, withDebt, withLayaway, layawayOverdue } = filters;
    const debouncedSearch = useDebouncedValue(search);

    const { tableProps, refetch } = useServerTable({
        service: useIndexCustomersPaginated,
        params: { search: debouncedSearch, withDebt, withLayaway, layawayOverdue, orderParam: "balance", order: "desc" },
    });

    return { tableProps, total: tableProps.totalRecords, refetch };
};
