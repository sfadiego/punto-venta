import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { superAdminAxios } from "@/contexts/SuperAdminContext";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

const url = (tenantId: number) => `${ApiRoutes.SuperAdminTenant}/${tenantId}/role-permissions`;
const QUERY_KEY = "super-admin-tenant-role-permissions";

export const useGetTenantRolePermissions = (tenantId: number) =>
    useQuery<Record<number, string[]>>({
        queryKey: [QUERY_KEY, tenantId],
        queryFn: async () => {
            const res = await superAdminAxios.get(url(tenantId));
            return res.data.data as Record<number, string[]>;
        },
        enabled: !!tenantId,
    });

export const useUpdateTenantRolePermission = (tenantId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ roleId, permissions }: { roleId: number; permissions: string[] }) =>
            superAdminAxios.put(`${url(tenantId)}/${roleId}`, { permissions }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tenantId] }),
    });
};
