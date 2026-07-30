import { useState, useEffect } from "react";
import { useAxios } from "@/hooks/useAxios";
import { RoleEnum } from "@/enums/RoleEnum";
import { useIndexUsers } from "@/services/useUserService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { IUser } from "@/models/IUser";

export const useUsersPage = () => {
    const { features } = useAxios();
    const { data: businessConfig } = useGetBusinessConfig();

    const [page, setPage]     = useState(1);
    const [limit, setLimit]   = useState(10);
    const [search, setSearch] = useState("");
    const [editingUser, setEditingUser] = useState<IUser | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data, isLoading, refetch } = useIndexUsers({ page, limit, search });

    useEffect(() => {
        if (!isLoading && (data?.data?.length ?? 0) === 0 && page > 1) {
            setPage((p) => p - 1);
        }
    }, [data, isLoading, page]);

    const sellByWeight = features?.sell_by_weight === true;
    const excludeRoles: RoleEnum[] = sellByWeight ? [RoleEnum.Cocina, RoleEnum.Caja] : [];

    const total = data?.total ?? 0;
    const maxUsers = businessConfig?.effective_max_users ?? null;
    const atUserLimit = maxUsers !== null && total >= maxUsers;

    const pageSize = [10, 20, 50];

    return {
        users: data?.data ?? [],
        total,
        maxUsers,
        atUserLimit,
        page,
        limit,
        pageSize,
        search,
        isLoading,
        refetch,
        setPage,
        setLimit,
        setSearch,
        editingUser,
        setEditingUser,
        isCreateModalOpen,
        openCreateModal: () => setIsCreateModalOpen(true),
        closeCreateModal: () => setIsCreateModalOpen(false),
        excludeRoles,
    };
};
