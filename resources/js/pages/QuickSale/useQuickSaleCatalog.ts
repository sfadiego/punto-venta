import { useEffect, useMemo, useState } from "react";
import { useCategoryList } from "@/services/useCategoriesService";
import { useInfiniteIndexProducts } from "@/services/useProductService";
import { IProduct } from "@/models/IProduct";

const SEARCH_DEBOUNCE_MS = 350;

export const useQuickSaleCatalog = () => {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: categories = [] } = useCategoryList();
    // null = "Todos" (sin filtrar por categoría) — es el estado inicial, así la búsqueda
    // (ej. escanear un código de barras) encuentra el producto sin importar su categoría.
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

    // Paginado con scroll infinito (24 por página) — con catálogos grandes, cargar todo de
    // golpe no escala. Mismo hook/patrón que Orders/partials/ProductSelector.
    const {
        data,
        isLoading: productsLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteIndexProducts({
        nombre: debouncedSearch,
        categoria_id: activeCategoryId,
    });
    const products: IProduct[] = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

    return {
        search,
        setSearch,
        categories,
        activeCategoryId,
        setActiveCategoryId,
        products,
        productsLoading,
        isFetchingNextPage,
        hasNextPage: !!hasNextPage,
        fetchNextPage,
    };
};
