import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { superAdminAxios } from "@/contexts/SuperAdminContext";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { TenantStatusEnum } from "@/enums/TenantStatusEnum";
import { ICreateTenantPayload, ITenant, IUpdateTenantPayload } from "@/models/ITenant";

const url = ApiRoutes.SuperAdminTenant;
const QUERY_KEY = "super-admin-tenants";

export const useListTenants = (status: TenantStatusEnum = TenantStatusEnum.All, refetchInterval?: number) =>
    useQuery<ITenant[]>({
        queryKey: [QUERY_KEY, status],
        queryFn: async () => {
            const params = status !== TenantStatusEnum.All ? { status } : {};
            const res = await superAdminAxios.get(url, { params });
            return res.data.data as ITenant[];
        },
        refetchInterval,
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
        mutationFn: (id: number) => superAdminAxios.delete(`${url}/${id}/demo-data`),
    });
