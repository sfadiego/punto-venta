import { useState, useEffect } from "react";

// Filtros y paginación del listado de productos (categoría, búsqueda con debounce, stock bajo).
// `debouncedSearch` se expone para que el hook que arma la query lo use como parámetro —
// `search` es el valor controlado del input, distinto del que realmente dispara la petición.
export const useProductFilters = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [lowStockOnly, setLowStockOnly] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    const handleCategoryChange = (id: number | null) => {
        setCategoryId(id);
        setPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleLowStockOnlyChange = (value: boolean) => {
        setLowStockOnly(value);
        setPage(1);
    };

    return {
        page,
        setPage,
        limit,
        setLimit,
        categoryId,
        search,
        debouncedSearch,
        lowStockOnly,
        handleCategoryChange,
        handleSearchChange,
        handleLowStockOnlyChange,
    };
};
