import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateCategoryQueries, useIndexCategoriesPaginated } from "@/services/useCategoriesService";
import { ICategory } from "@/models/ICategory";
import { useServerTable } from "@/hooks/useServerTable";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export const useCategoriesPage = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search);

    const { tableProps, refetch } = useServerTable({
        service: useIndexCategoriesPaginated,
        params: { search: debouncedSearch || undefined },
    });

    const invalidateCategories = () => {
        void invalidateCategoryQueries(queryClient);
    };

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
        tableProps,
        total: tableProps.totalRecords,
        refetch,
        search,
        handleSearchChange: setSearch,
        isModalOpen,
        editingCategory,
        openAddModal,
        openEditModal,
        handleCloseModal,
        invalidateCategories,
    };
};
