import { useEffect, useState } from "react";
import { useCategoryList } from "@/services/useCategoriesService";
import { useIndexProducts } from "@/services/useProductService";
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
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

    // Selecciona la primera categoría en cuanto llegan del backend.
    useEffect(() => {
        if (activeCategoryId === null && categories.length > 0) {
            setActiveCategoryId(categories[0].id ?? null);
        }
    }, [categories, activeCategoryId]);

    const { data: productsData, isLoading: productsLoading } = useIndexProducts({
        page: 1,
        limit: 100,
        order: "asc",
        categoria_id: activeCategoryId,
        nombre: debouncedSearch,
    });
    const products: IProduct[] = productsData?.data ?? [];

    return { search, setSearch, categories, activeCategoryId, setActiveCategoryId, products, productsLoading };
};
