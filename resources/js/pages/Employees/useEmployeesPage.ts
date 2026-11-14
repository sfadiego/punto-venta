import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useIndexEmployeesPaginated } from "@/services/useEmployeesService";
import { useServerTable } from "@/hooks/useServerTable";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export const useEmployeesPage = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [active, setActive] = useState("");
    const debouncedSearch = useDebouncedValue(search);

    const { tableProps, refetch } = useServerTable({
        service: useIndexEmployeesPaginated,
        params: { search: debouncedSearch, active },
    });

    const invalidateEmployees = () => {
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Employee] });
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Employee}/list`] });
    };

    return {
        tableProps,
        total: tableProps.totalRecords,
        refetch,
        search,
        setSearch,
        active,
        setActive,
        invalidateEmployees,
    };
};
