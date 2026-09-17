import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useIndexBranchesPaginated } from "@/services/useBranchService";
import { IBranch } from "@/models/IBranch";

export const useBranchesPage = () => {
    const queryClient = useQueryClient();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<IBranch | null>(null);
    const [usersModalBranch, setUsersModalBranch] = useState<IBranch | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading, refetch } = useIndexBranchesPaginated({
        page,
        limit,
        search: debouncedSearch || undefined,
    });

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    useEffect(() => {
        if (!isLoading && data?.data?.length === 0 && page > 1) {
            setPage((p) => p - 1);
        }
    }, [data, isLoading, page]);

    const invalidateBranches = () => {
        queryClient.invalidateQueries({
            predicate: (query) => typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith(ApiRoutes.Branch),
        });
    };

    const pageSize = [10, 20, 50];

    const openAddModal = () => {
        setEditingBranch(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (branch: IBranch) => {
        setEditingBranch(branch);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => setIsFormModalOpen(false);

    const openUsersModal = (branch: IBranch) => setUsersModalBranch(branch);
    const closeUsersModal = () => {
        setUsersModalBranch(null);
        invalidateBranches();
    };

    return {
        branches: data?.data ?? [],
        total: data?.total ?? 0,
        page,
        limit,
        pageSize,
        isLoading,
        refetch,
        setPage,
        setLimit,
        search,
        handleSearchChange,
        isFormModalOpen,
        editingBranch,
        openAddModal,
        openEditModal,
        handleCloseFormModal,
        invalidateBranches,
        usersModalBranch,
        openUsersModal,
        closeUsersModal,
    };
};
