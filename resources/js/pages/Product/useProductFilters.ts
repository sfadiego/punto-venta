import { useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

// Filtros del listado de productos (categoría, búsqueda con debounce, stock bajo).
// `debouncedSearch` se expone para que el hook que arma la query lo use como parámetro —
// `search` es el valor controlado del input, distinto del que realmente dispara la petición.
export const useProductFilters = () => {
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search);
    const [lowStockOnly, setLowStockOnly] = useState(false);

    return {
        categoryId,
        search,
        debouncedSearch,
        lowStockOnly,
        handleCategoryChange: setCategoryId,
        handleSearchChange: setSearch,
        handleLowStockOnlyChange: setLowStockOnly,
    };
};
