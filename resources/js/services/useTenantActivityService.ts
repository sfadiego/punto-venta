import { useQuery } from "@tanstack/react-query";
import { superAdminAxios } from "@/contexts/SuperAdminContext";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { ITenantActivityReport } from "@/models/ITenantActivity";

const url = ApiRoutes.SuperAdminTenant;

export const useGetTenantActivity = (tenantId: number, days: number) =>
    useQuery<ITenantActivityReport>({
        queryKey: ["super-admin-tenant-activity", tenantId, days],
        queryFn: async () => {
            const res = await superAdminAxios.get(`${url}/${tenantId}/activity`, { params: { days } });
            return res.data.data as ITenantActivityReport;
        },
        enabled: !!tenantId,
    });
