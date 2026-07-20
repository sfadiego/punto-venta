import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useIndexCustomersPaginated } from "@/services/useCustomerService";
import { ICustomer } from "@/models/ICustomer";

export const useCustomersPage = () => {
    const queryClient = useQueryClient();
    const [editingCustomer, setEditingCustomer] = useState<ICustomer | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [withDebt, setWithDebt] = useState(false);

    const { data, isLoading, refetch } = useIndexCustomersPaginated({
        page, limit, search, withDebt, orderParam: "balance", order: "desc",
    });

    useEffect(() => {
        if (!isLoading && data?.data?.length === 0 && page > 1) {
            setPage((p) => p - 1);
        }
    }, [data, isLoading, page]);

    const invalidateCustomers = () => {
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Customer] });
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Customer}/list`] });
    };

    const pageSize = [10, 20, 50];

    return {
        customers: data?.data ?? [],
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
        withDebt,
        setWithDebt,
        editingCustomer,
        setEditingCustomer,
        invalidateCustomers,
    };
};
