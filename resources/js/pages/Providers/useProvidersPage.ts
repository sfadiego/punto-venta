import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useIndexProvidersPaginated } from "@/services/useProvidersService";

export const useProvidersPage = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");

    const { data, isLoading, refetch } = useIndexProvidersPaginated({
        page, limit, search,
    });

    useEffect(() => {
        if (!isLoading && data?.data?.length === 0 && page > 1) {
            setPage((p) => p - 1);
        }
    }, [data, isLoading, page]);

    const invalidateProviders = () => {
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Provider] });
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Provider}/list`] });
    };

    const pageSize = [10, 20, 50];

    return {
        providers: data?.data ?? [],
        total: data?.total ?? 0,
        page,
        limit,
        pageSize,
        isLoading,
        refetch,
        setPage,
        setLimit,
        search,
        setSearch,
        invalidateProviders,
    };
};
