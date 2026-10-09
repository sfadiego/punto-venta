import { useEffect, useState } from "react";
import { useIndexCustomersPaginated } from "@/services/useCustomerService";
import { CustomersFilters } from "./useCustomersFilters";

const PAGE_SIZES = [10, 20, 50];

// Listado paginado de clientes según los filtros activos. Cambiar un filtro vuelve a la primera
// página; si la página actual queda vacía (ej. tras eliminar), retrocede una.
export const useCustomersList = (filters: CustomersFilters) => {
    const { search, withDebt, withLayaway, layawayOverdue } = filters;
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(PAGE_SIZES[0]);

    const { data, isLoading, refetch } = useIndexCustomersPaginated({
        page, limit, search, withDebt, withLayaway, layawayOverdue, orderParam: "balance", order: "desc",
    });

    useEffect(() => {
        setPage(1);
    }, [search, withDebt, withLayaway, layawayOverdue]);

    useEffect(() => {
        if (!isLoading && data?.data?.length === 0 && page > 1) {
            setPage((p) => p - 1);
        }
    }, [data, isLoading, page]);

    return {
        customers: data?.data ?? [],
        total: data?.total ?? 0,
        page,
        limit,
        pageSizes: PAGE_SIZES,
        isLoading,
        refetch,
        setPage,
        setLimit,
    };
};
