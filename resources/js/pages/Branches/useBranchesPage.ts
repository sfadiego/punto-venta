import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useIndexBranchesPaginated } from "@/services/useBranchService";
import { IBranch } from "@/models/IBranch";
import { useServerTable } from "@/hooks/useServerTable";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export const useBranchesPage = () => {
    const queryClient = useQueryClient();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<IBranch | null>(null);
    const [usersModalBranch, setUsersModalBranch] = useState<IBranch | null>(null);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search);

    const { tableProps, refetch } = useServerTable({
        service: useIndexBranchesPaginated,
        params: { search: debouncedSearch || undefined },
    });

    const invalidateBranches = () => {
        queryClient.invalidateQueries({
            predicate: (query) => typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith(ApiRoutes.Branch),
        });
    };

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
        tableProps,
        total: tableProps.totalRecords,
        refetch,
        search,
        handleSearchChange: setSearch,
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
