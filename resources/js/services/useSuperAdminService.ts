import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { superAdminAxios } from "@/contexts/SuperAdminContext";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { TenantStatusEnum } from "@/enums/TenantStatusEnum";
import { ICreateTenantPayload, ITenant, IUpdateTenantPayload } from "@/models/ITenant";
import { IPaginate } from "@/intefaces/IPaginate";

const url = ApiRoutes.SuperAdminTenant;
export const TENANT_QUERY_KEY = "super-admin-tenants";
const QUERY_KEY = TENANT_QUERY_KEY;

// limit opcional: el backend defaultea a 15 (IndexData) si se omite — usado tal cual por
// useTenantForm/useTenantUsers (dropdowns que no necesitan el listado completo). Los widgets
// de resumen de TenantListPage sí necesitan ver todos los tenants elegibles para sumar bien,
// así que pasan un limit explícito y alto en vez de depender del default.
export const useListTenants = (
    status: TenantStatusEnum = TenantStatusEnum.All,
    refetchInterval?: number,
    isDemo?: boolean,
    limit?: number,
) =>
    useQuery<ITenant[]>({
        queryKey: [QUERY_KEY, status, isDemo, limit],
        queryFn: async () => {
            const params: Record<string, string | number | boolean> = { status };
            if (isDemo !== undefined) params.is_demo = isDemo;
            if (limit !== undefined) params.limit = limit;
            const res = await superAdminAxios.get(url, { params });
            return res.data.data as ITenant[];
        },
        refetchInterval,
    });

interface IListTenantsPaginatedParams {
    status: TenantStatusEnum;
    isDemo?: boolean;
    search?: string;
    page: number;
    limit: number;
}

// Versión paginada — usada por la tabla de TenantListPage (a diferencia de useListTenants,
// que descarta la metadata de paginación y solo devuelve el array `data`).
export const useListTenantsPaginated = ({ status, isDemo, search, page, limit }: IListTenantsPaginatedParams) =>
    useQuery<IPaginate<ITenant>>({
        queryKey: [QUERY_KEY, "paginated", status, isDemo, search, page, limit],
        queryFn: async () => {
            const params: Record<string, string | number | boolean> = { status, page, limit };
            if (isDemo !== undefined) params.is_demo = isDemo;
            if (search) params.search = search;
            const res = await superAdminAxios.get(url, { params });
            return res.data as IPaginate<ITenant>;
        },
        placeholderData: (prev) => prev,
    });

export const useGetTenant = (id: number) =>
    useQuery<ITenant>({
        queryKey: [QUERY_KEY, "detail", id],
        queryFn: async () => {
            const res = await superAdminAxios.get(`${url}/${id}`);
            return res.data.data as ITenant;
        },
        enabled: !!id,
        refetchInterval: 30_000,
    });

export const useCreateTenant = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: ICreateTenantPayload) => superAdminAxios.post(url, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};

export const useUpdateTenant = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: IUpdateTenantPayload }) =>
            superAdminAxios.put(`${url}/${id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};

export const useToggleTenant = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => superAdminAxios.patch(`${url}/${id}/toggle`),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};

export const useRestoreTenant = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => superAdminAxios.patch(`${url}/${id}/restore`),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};

export const useDeleteTenant = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => superAdminAxios.delete(`${url}/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};

export const useClearDemoData = () =>
    useMutation({
        mutationFn: ({ id, deepClean }: { id: number; deepClean: boolean }) =>
            superAdminAxios.delete(`${url}/${id}/demo-data`, { data: { deep_clean: deepClean } }),
    });
