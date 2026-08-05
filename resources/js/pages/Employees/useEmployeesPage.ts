import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useIndexEmployeesPaginated } from "@/services/useEmployeesService";

export const useEmployeesPage = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [active, setActive] = useState("");

    const { data, isLoading, refetch } = useIndexEmployeesPaginated({
        page, limit, search, active,
    });

    useEffect(() => {
        if (!isLoading && data?.data?.length === 0 && page > 1) {
            setPage((p) => p - 1);
        }
    }, [data, isLoading, page]);

    const invalidateEmployees = () => {
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Employee] });
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Employee}/list`] });
    };

    const handleActiveChange = (value: string) => {
        setActive(value);
        setPage(1);
    };

    const pageSize = [10, 20, 50];

    return {
        employees: data?.data ?? [],
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
        active,
        setActive: handleActiveChange,
        invalidateEmployees,
    };
};
