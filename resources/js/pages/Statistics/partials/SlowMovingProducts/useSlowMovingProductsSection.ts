import { useState } from "react";
import { DataTableSortStatus } from "mantine-datatable";
import { useCategoryList } from "@/services/useCategoriesService";
import { useSlowMovingProducts, useSlowMovingSummary } from "@/services/useSlowMovingProductsService";
import { ISlowMovingProduct, SlowMovingSortColumn } from "@/models/ISlowMovingProduct";
import { DEFAULT_SLOW_MOVING_DAYS } from "@/utils/slowMoving";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useServerTable } from "@/hooks/useServerTable";

export const useSlowMovingProductsSection = () => {
    const [days, setDays] = useState(DEFAULT_SLOW_MOVING_DAYS);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search);
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus<ISlowMovingProduct>>({
        columnAccessor: "days_idle",
        direction: "desc",
    });

    const filters = {
        days,
        search: debouncedSearch,
        categoria_id: categoryId,
        orderParam: sortStatus.columnAccessor as SlowMovingSortColumn,
        order: sortStatus.direction,
    };

    const { tableProps } = useServerTable({ service: useSlowMovingProducts, params: filters });
    const { data: summary } = useSlowMovingSummary(days);
    const { data: categories = [] } = useCategoryList();

    return {
        days,
        search,
        categoryId,
        categories,
        tableProps,
        sortStatus,
        summary,
        // Filtros activos (con la búsqueda ya con debounce) para exportar el mismo listado que se ve.
        exportFilters: filters,
        handleDaysChange: setDays,
        handleSearchChange: setSearch,
        handleCategoryChange: setCategoryId,
        handleSortChange: setSortStatus,
    };
};
