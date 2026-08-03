import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useIndexCategoriesPaginated } from "@/services/useCategoriesService";
import { ICategory } from "@/models/ICategory";

export const useCategoriesPage = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const { data, isLoading, refetch } = useIndexCategoriesPaginated({ page, limit });

    // If the current page is empty after a deletion and we're not on page 1, go back
    useEffect(() => {
        if (!isLoading && data?.data?.length === 0 && page > 1) {
            setPage((p) => p - 1);
        }
    }, [data, isLoading, page]);

    const invalidateCategories = () => {
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Category] });
    };

    const pageSize = [10, 20, 50];

    const handleCloseModal = () => setIsModalOpen(false);

    const openAddModal = () => {
        setEditingCategory(null);
        setIsModalOpen(true);
    };

    const openEditModal = (category: ICategory) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    return {
        categories: data?.data ?? [],
        total: data?.total ?? 0,
        page,
        limit,
        pageSize,
        isLoading,
        refetch,
        setPage,
        setLimit,
        isModalOpen,
        editingCategory,
        openAddModal,
        openEditModal,
        handleCloseModal,
        invalidateCategories,
    };
};
