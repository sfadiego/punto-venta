import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { superAdminAxios } from "@/contexts/SuperAdminContext";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { FeatureSpotlightKey } from "@/enums/FeatureSpotlightEnum";

export interface ITenantFeatureSpotlight {
    key: FeatureSpotlightKey;
    enabled: boolean;
}

const url = (tenantId: number) => `${ApiRoutes.SuperAdminTenant}/${tenantId}/feature-spotlights`;
const QUERY_KEY = "super-admin-tenant-feature-spotlights";

export const useGetTenantFeatureSpotlights = (tenantId: number) =>
    useQuery<ITenantFeatureSpotlight[]>({
        queryKey: [QUERY_KEY, tenantId],
        queryFn: async () => {
            const res = await superAdminAxios.get(url(tenantId));
            return res.data.data as ITenantFeatureSpotlight[];
        },
        enabled: !!tenantId,
    });

export const useUpdateTenantFeatureSpotlights = (tenantId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (enabledKeys: FeatureSpotlightKey[]) =>
            superAdminAxios.put(url(tenantId), { enabled_keys: enabledKeys }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tenantId] }),
    });
};
