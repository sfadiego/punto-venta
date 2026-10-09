import { useEffect, useState } from "react";
import { DataTableSortStatus } from "mantine-datatable";
import { useCategoryList } from "@/services/useCategoriesService";
import { useSlowMovingProducts, useSlowMovingSummary } from "@/services/useSlowMovingProductsService";
import { ISlowMovingProduct, SlowMovingSortColumn } from "@/models/ISlowMovingProduct";
import { DEFAULT_SLOW_MOVING_DAYS } from "@/utils/slowMoving";

const PAGE_SIZES = [10, 20, 50];

export const useSlowMovingProductsSection = () => {
    const [days, setDays] = useState(DEFAULT_SLOW_MOVING_DAYS);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(PAGE_SIZES[0]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus<ISlowMovingProduct>>({
        columnAccessor: "days_idle",
        direction: "desc",
    });

    // Debounce de la búsqueda — no pedir al servidor en cada tecla.
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    const filters = {
        days,
        search: debouncedSearch,
        categoria_id: categoryId,
        orderParam: sortStatus.columnAccessor as SlowMovingSortColumn,
        order: sortStatus.direction,
    };

    const { data, isLoading, isFetching } = useSlowMovingProducts({ ...filters, page, limit });
    const { data: summary } = useSlowMovingSummary(days);
    const { data: categories = [] } = useCategoryList();

    // Si tras cambiar de filtro la página actual quedó vacía, vuelve a la primera.
    useEffect(() => {
        if (!isLoading && data?.data?.length === 0 && page > 1) setPage(1);
    }, [data, isLoading, page]);

    const resetPage = () => setPage(1);

    return {
        days,
        search,
        categoryId,
        categories,
        records: data?.data ?? [],
        total: data?.total ?? 0,
        page,
        limit,
        pageSizes: PAGE_SIZES,
        sortStatus,
        summary,
        // Filtros activos (con la búsqueda ya con debounce) para exportar el mismo listado que se ve.
        exportFilters: filters,
        isLoading,
        isFetching,
        handleDaysChange: (value: number) => { setDays(value); resetPage(); },
        handleSearchChange: (value: string) => { setSearch(value); resetPage(); },
        handleCategoryChange: (value: number | null) => { setCategoryId(value); resetPage(); },
        handleSortChange: (status: DataTableSortStatus<ISlowMovingProduct>) => { setSortStatus(status); resetPage(); },
        setPage,
        setLimit,
    };
};
