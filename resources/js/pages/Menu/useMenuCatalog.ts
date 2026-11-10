import { useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useGetMenuBusiness, useInfiniteMenuProducts } from "@/services/useMenuService";
import { useInfiniteScrollSentinel } from "@/hooks/useInfiniteScrollSentinel";

export const useMenuCatalog = () => {
    const { slug = "" } = useParams<{ slug: string }>();
    const [searchParams] = useSearchParams();
    const readonly = searchParams.get("readonly") === "true";

    const { data: business, isLoading: loadingBusiness } = useGetMenuBusiness(slug);

    const {
        data: productsPages,
        isLoading: loadingProducts,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteMenuProducts(slug);

    const [search, setSearch] = useState("");
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

    // Flatten all pages into a single categories array
    const categories = useMemo(
        () => productsPages?.pages.flatMap((p) => p.data) ?? [],
        [productsPages]
    );

    const sentinelRef = useInfiniteScrollSentinel({ hasNextPage, isFetchingNextPage, fetchNextPage });

    const filteredCategories = useMemo(() => {
        const byCategory = activeCategoryId
            ? categories.filter((c) => c.id === activeCategoryId)
            : categories;

        if (!search.trim()) return byCategory;

        const q = search.toLowerCase();
        return byCategory
            .map((c) => ({
                ...c,
                products: c.nombre.toLowerCase().includes(q)
                    ? c.products
                    : c.products.filter(
                          (p) =>
                              p.nombre.toLowerCase().includes(q) ||
                              (p.descripcion ?? "").toLowerCase().includes(q)
                      ),
            }))
            .filter((c) => c.products.length > 0);
    }, [categories, activeCategoryId, search]);

    // All categories across all loaded pages (for the filter pills)
    const allCategories = useMemo(
        () => productsPages?.pages[0]
            ? categories
            : [],
        [categories, productsPages]
    );

    return {
        slug,
        readonly,
        business,
        isLoading: loadingBusiness || loadingProducts,
        categories: allCategories,
        filteredCategories,
        isFetchingNextPage,
        hasNextPage,
        sentinelRef,
        search,
        setSearch,
        activeCategoryId,
        setActiveCategoryId,
    };
};
