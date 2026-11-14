import { useState } from "react";
import { useAxios } from "@/hooks/useAxios";
import { getExcludedRoles } from "@/utils/businessRoles";
import { useIndexUsers } from "@/services/useUserService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { IUser } from "@/models/IUser";
import { useServerTable } from "@/hooks/useServerTable";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export const useUsersPage = () => {
    const { features } = useAxios();
    const { data: businessConfig } = useGetBusinessConfig();

    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search);
    const [editingUser, setEditingUser] = useState<IUser | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { tableProps, refetch } = useServerTable({
        service: useIndexUsers,
        params: { search: debouncedSearch },
    });

    const excludeRoles = getExcludedRoles(features);

    const total = tableProps.totalRecords;
    const maxUsers = businessConfig?.effective_max_users ?? null;
    const atUserLimit = maxUsers !== null && total >= maxUsers;

    return {
        tableProps,
        total,
        maxUsers,
        atUserLimit,
        search,
        refetch,
        setSearch,
        editingUser,
        setEditingUser,
        isCreateModalOpen,
        openCreateModal: () => setIsCreateModalOpen(true),
        closeCreateModal: () => setIsCreateModalOpen(false),
        excludeRoles,
    };
};
