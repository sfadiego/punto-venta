import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useIndexProvidersPaginated } from "@/services/useProvidersService";
import { useServerTable } from "@/hooks/useServerTable";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export const useProvidersPage = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [active, setActive] = useState("");
    const debouncedSearch = useDebouncedValue(search);

    const { tableProps, refetch } = useServerTable({
        service: useIndexProvidersPaginated,
        params: { search: debouncedSearch, active },
    });

    const invalidateProviders = () => {
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Provider] });
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Provider}/list`] });
    };

    return {
        tableProps,
        total: tableProps.totalRecords,
        refetch,
        search,
        setSearch,
        active,
        setActive,
        invalidateProviders,
    };
};
