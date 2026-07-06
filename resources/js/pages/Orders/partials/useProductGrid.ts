import { useState, useMemo, useCallback, useEffect } from "react";
import { useInfiniteIndexProducts } from "@/services/useProductService";
import { useIndexCategories } from "@/services/useCategoriesService";
import { IProduct } from "@/models/IProduct";

export type CategoryOption = {
    id?: number;
    name: string;
    count?: number;
    icon?: string;
};

const DEBOUNCE_MS = 350;

export const useProductGrid = () => {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [activeCategory, setActiveCategoryName] = useState("Todos");
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: categoriesData } = useIndexCategories();

    const categories = useMemo((): CategoryOption[] => [
        { name: "Todos" },
        ...(categoriesData ?? []).map((c) => ({
            id: c.id,
            name: c.nombre,
            icon: c.icon_name,
        })),
    ], [categoriesData]);

    const setActiveCategory = useCallback((name: string) => {
        setActiveCategoryName(name);
        const found = (categoriesData ?? []).find((c) => c.nombre === name);
        setActiveCategoryId(found?.id ?? null);
    }, [categoriesData]);

    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteIndexProducts({
        nombre: debouncedSearch,
        categoria_id: activeCategoryId,
    });

    const products: IProduct[] = useMemo(
        () => data?.pages.flatMap((p) => p.data) ?? [],
        [data],
    );

    const total = data?.pages[0]?.total ?? 0;

    return {
        search,
        setSearch,
        activeCategory,
        setActiveCategory,
        categories,
        products,
        total,
        isLoading,
        isFetchingNextPage,
        hasNextPage: !!hasNextPage,
        fetchNextPage,
    };
};
