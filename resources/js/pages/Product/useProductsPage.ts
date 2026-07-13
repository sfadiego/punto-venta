import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useIndexProducts } from "@/services/useProductService";
import { useIndexCategories } from "@/services/useCategoriesService";

export const useProductsPage = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading, refetch } = useIndexProducts({
        page,
        limit,
        categoria_id: categoryId,
        nombre: debouncedSearch || undefined,
    });
    const { data: categories } = useIndexCategories();

    const handleCategoryChange = (id: number | null) => {
        setCategoryId(id);
        setPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const invalidateProducts = () => {
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Product] });
    };

    const pageSize = [10, 20, 50];

    return {
        products: data?.data ?? [],
        total: data?.total ?? 0,
        page,
        limit,
        pageSize,
        isLoading,
        categories: categories ?? [],
        categoryId,
        search,
        setPage,
        setLimit,
        refetch,
        handleCategoryChange,
        handleSearchChange,
        invalidateProducts,
    };
};
