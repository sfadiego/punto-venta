import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { superAdminAxios } from "@/contexts/SuperAdminContext";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { ICreateUserPayload, IUpdateUserPayload, IUser } from "@/models/IUser";
import { ILoginLockStatus } from "@/models/ILoginLock";
import { IUserBranches } from "@/models/IBranch";

const baseUrl = (tenantId: number) => `${ApiRoutes.SuperAdminTenant}/${tenantId}/users`;
const QUERY_KEY = "tenant-users";
const LOGIN_LOCK_QUERY_KEY = "tenant-user-login-lock";

export const useListTenantUsers = (tenantId: number) =>
    useQuery<IUser[]>({
        queryKey: [QUERY_KEY, tenantId],
        queryFn: async () => {
            const res = await superAdminAxios.get(baseUrl(tenantId));
            return res.data.data as IUser[];
        },
        enabled: !!tenantId,
    });

export const useCreateTenantUser = (tenantId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: ICreateUserPayload) =>
            superAdminAxios.post(baseUrl(tenantId), payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, tenantId] }),
    });
};

export const useUpdateTenantUser = (tenantId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: IUpdateUserPayload }) =>
            superAdminAxios.put(`${baseUrl(tenantId)}/${id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, tenantId] }),
    });
};

export const useDeleteTenantUser = (tenantId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (userId: number) =>
            superAdminAxios.delete(`${baseUrl(tenantId)}/${userId}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, tenantId] }),
    });
};

export const useSeedTenantUsers = (tenantId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload?: { branch_id?: number }) =>
            superAdminAxios.post(`${baseUrl(tenantId)}/seed`, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, tenantId] }),
    });
};

const BRANCHES_QUERY_KEY = "tenant-user-branches";

export const useTenantUserBranches = (tenantId: number, userId: number) =>
    useQuery<IUserBranches>({
        queryKey: [BRANCHES_QUERY_KEY, tenantId, userId],
        queryFn: async () => {
            const res = await superAdminAxios.get(`${baseUrl(tenantId)}/${userId}/branches`);
            return res.data.data as IUserBranches;
        },
        enabled: !!tenantId && !!userId,
    });

export const useSyncTenantUserBranches = (tenantId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, branchIds }: { userId: number; branchIds: number[] }) =>
            superAdminAxios.put(`${baseUrl(tenantId)}/${userId}/branches`, { branch_ids: branchIds }),
        onSuccess: (_data, { userId }) =>
            qc.invalidateQueries({ queryKey: [BRANCHES_QUERY_KEY, tenantId, userId] }),
    });
};

export const useLoginLockStatus = (tenantId: number, userId: number) =>
    useQuery<ILoginLockStatus>({
        queryKey: [LOGIN_LOCK_QUERY_KEY, tenantId, userId],
        queryFn: async () => {
            const res = await superAdminAxios.get(`${baseUrl(tenantId)}/${userId}/login-lock`);
            return res.data.data as ILoginLockStatus;
        },
        enabled: !!tenantId && !!userId,
        // El bloqueo se libera solo a los 60s; refresca para reflejarlo sin recargar la página
        refetchInterval: 15000,
    });

export const useUnblockLogin = (tenantId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (userId: number) =>
            superAdminAxios.delete(`${baseUrl(tenantId)}/${userId}/login-lock`),
        onSuccess: (_data, userId) =>
            qc.invalidateQueries({ queryKey: [LOGIN_LOCK_QUERY_KEY, tenantId, userId] }),
    });
};
