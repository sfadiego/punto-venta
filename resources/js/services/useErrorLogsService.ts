import { useQuery } from "@tanstack/react-query";
import { superAdminAxios } from "@/contexts/SuperAdminContext";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IErrorLog } from "@/models/IErrorLog";
import { IPaginate } from "@/intefaces/IPaginate";

const url = ApiRoutes.SuperAdminErrorLogs;
const QUERY_KEY = "super-admin-error-logs";

export const useIndexErrorLogs = ({
    page = 1,
    limit = 20,
    source = "",
}: {
    page?: number;
    limit?: number;
    source?: string;
} = {}) =>
    useQuery<IPaginate<IErrorLog>>({
        queryKey: [QUERY_KEY, page, limit, source],
        queryFn: async () => {
            const params: Record<string, unknown> = { page, limit };
            if (source) params.source = source;
            const res = await superAdminAxios.get(url, { params });
            return res.data as IPaginate<IErrorLog>;
        },
        staleTime: 30_000,
    });
