import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useGetMenuBusiness, useInfiniteMenuProducts } from "@/services/useMenuService";
import { useCart } from "./useCart";

export const useMenuPage = () => {
    const { slug = "" } = useParams<{ slug: string }>();

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
    const [cartOpen, setCartOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);

    const cart = useCart();

    // Flatten all pages into a single categories array
    const categories = useMemo(
        () => productsPages?.pages.flatMap((p) => p.data) ?? [],
        [productsPages]
    );

    // Sentinel ref for IntersectionObserver
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const handleIntersect = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        },
        [hasNextPage, isFetchingNextPage, fetchNextPage]
    );

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(handleIntersect, { threshold: 0.1 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [handleIntersect]);

    const filteredCategories = useMemo(() => {
        const byCategory = activeCategoryId
            ? categories.filter((c) => c.id === activeCategoryId)
            : categories;

        if (!search.trim()) return byCategory;

        const q = search.toLowerCase();
        return byCategory
            .map((c) => ({
                ...c,
                products: c.products.filter(
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
        cart,
        cartOpen,
        setCartOpen,
        checkoutOpen,
        setCheckoutOpen,
    };
};
