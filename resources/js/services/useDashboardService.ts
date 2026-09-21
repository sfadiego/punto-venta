import { useQuery } from "@tanstack/react-query";
import { superAdminAxios } from "@/contexts/SuperAdminContext";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IDashboardSummary } from "@/models/IDashboard";

const url = ApiRoutes.SuperAdminDashboard;
const QUERY_KEY = "super-admin-dashboard";

export const useGetDashboardSummary = () =>
    useQuery<IDashboardSummary>({
        queryKey: [QUERY_KEY],
        queryFn: async () => {
            const res = await superAdminAxios.get(url);
            return res.data.data as IDashboardSummary;
        },
        refetchInterval: 30_000,
    });
