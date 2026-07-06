import { IProduct } from "@/models/IProduct";
import { axiosGET, useDELETE, useGET, usePOST, usePUT } from "../hooks/useApi";
import { ICategory } from "../models/ICategory";
import { IPaginate } from "@/intefaces/IPaginate";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useQuery } from "@tanstack/react-query";
import { useAxios } from "@/hooks/useAxios";

const url = ApiRoutes.Category;

// Full list — used for dropdowns and filters.
// The backend always returns paginated; request a large limit to get all records.
export const useIndexCategories = (search = "") => {
    const query = useGET<IPaginate<ICategory>>({
        url,
        nameQuery: `${url}/all`,
        filters: { limit: 1000, page: 1, ...(search ? { search } : {}) },
    });
    return { ...query, data: query.data?.data ?? [] };
};

// Paginated — used for the categories DataTable
export const useIndexCategoriesPaginated = ({
    page = 1,
    limit = 10,
    search = "",
}: { page?: number; limit?: number; search?: string } = {}) =>
    useGET<IPaginate<ICategory>>({
        url,
        nameQuery: url,
        filters: { page, limit, ...(search ? { search } : {}) },
    });

export const useShowCategory = (id: number) =>
    useGET<ICategory>({ url: `${url}/${id}` });

export const useProductByCategory = (categoryId: number, enable: boolean) =>
    useGET<IProduct>({
        url: `${url}/${categoryId}/product`,
        enable,
    });

// Lightweight list for TakeOrder category pills — minimal payload, cached for the session.
// Uses /api/category/list which returns [{id, nombre, icon_name}] without pagination overhead.
export const useCategoryList = () => {
    const { axiosApi } = useAxios();
    return useQuery<ICategory[]>({
        queryKey: [`${url}/list`],
        queryFn: () => axiosGET(axiosApi, { url: `${url}/list` }),
        staleTime: Infinity,
        gcTime: 30 * 60 * 1000,
    });
};

// Admin routes
const adminUrl = ApiRoutes.Category; // POST/PUT/DELETE go to /api/category and /api/category/{id}
export const useStoreCategory = () => usePOST({ url: adminUrl });
export const useUpdateCategory = (categoryId: number) =>
    usePUT({ url: `${adminUrl}/${categoryId}` });
export const useDeleteCategory = (categoryId: number) =>
    useDELETE({ url: `${adminUrl}/${categoryId}` });
