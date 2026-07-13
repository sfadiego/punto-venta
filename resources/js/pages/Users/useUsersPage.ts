import { useState, useEffect } from "react";
import { useAxios } from "@/hooks/useAxios";
import { RoleEnum } from "@/enums/RoleEnum";
import { useIndexUsers } from "@/services/useUserService";
import { IUser } from "@/models/IUser";

export const useUsersPage = () => {
    const { features } = useAxios();

    const [page, setPage]     = useState(1);
    const [limit, setLimit]   = useState(10);
    const [search, setSearch] = useState("");
    const [editingUser, setEditingUser] = useState<IUser | null>(null);

    const { data, isLoading, refetch } = useIndexUsers({ page, limit, search });

    useEffect(() => {
        if (!isLoading && (data?.data?.length ?? 0) === 0 && page > 1) {
            setPage((p) => p - 1);
        }
    }, [data, isLoading, page]);

    const sellByWeight = features?.sell_by_weight === true;
    const excludeRoles: RoleEnum[] = sellByWeight ? [RoleEnum.Cocina, RoleEnum.Caja] : [];

    const pageSize = [10, 20, 50];

    return {
        users: data?.data ?? [],
        total: data?.total ?? 0,
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
        excludeRoles,
    };
};
