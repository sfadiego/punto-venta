import { useQueryClient } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useIndexProducts } from "@/services/useProductService";
import { useIndexCategories } from "@/services/useCategoriesService";
import { useProductFilters } from "./useProductFilters";
import { useProductModalState } from "./useProductModalState";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

// Compone los filtros (useProductFilters) y el estado del modal (useProductModalState), y
// agrega la query de productos/categorías + la invalidación tras guardar un producto.
export const useProductsPage = () => {
    const queryClient = useQueryClient();
    const filters = useProductFilters();
    const modalState = useProductModalState();

    const { data, isLoading, refetch } = useIndexProducts({
        page: filters.page,
        limit: filters.limit,
        categoria_id: filters.categoryId,
        nombre: filters.debouncedSearch || undefined,
        low_stock: filters.lowStockOnly,
    });
    const { data: categories } = useIndexCategories();

    const invalidateProducts = () => {
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Product] });
        // Crear/editar un producto puede generar un movimiento de stock (carga inicial) —
        // invalidar también el kardex global para que no quede con datos obsoletos por el
        // staleTime de 2 min (ver app.tsx) hasta un refresh manual.
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Kardex] });
    };

    return {
        products: data?.data ?? [],
        total: data?.total ?? 0,
        page: filters.page,
        limit: filters.limit,
        pageSize: PAGE_SIZE_OPTIONS,
        isLoading,
        categories: categories ?? [],
        categoryId: filters.categoryId,
        search: filters.search,
        lowStockOnly: filters.lowStockOnly,
        setPage: filters.setPage,
        setLimit: filters.setLimit,
        refetch,
        handleCategoryChange: filters.handleCategoryChange,
        handleSearchChange: filters.handleSearchChange,
        handleLowStockOnlyChange: filters.handleLowStockOnlyChange,
        invalidateProducts,
        ...modalState,
    };
};
