import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePOST } from "@/hooks/useApi";
import { superAdminAxios } from "@/contexts/SuperAdminContext";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IPaginate } from "@/intefaces/IPaginate";
import {
    ICreateDemoRequestPayload,
    IDemoRequest,
    IUpdateDemoRequestPayload,
} from "@/models/IDemoRequest";

// Público — usado desde AuthPage (sin sesión de tenant ni de super-admin)
export const useCreateDemoRequest = () =>
    usePOST<ICreateDemoRequestPayload>({ url: ApiRoutes.DemoRequest });

// Super-admin — panel de solicitudes de demo
const url = ApiRoutes.SuperAdminDemoRequests;
const QUERY_KEY = "super-admin-demo-requests";

export const useIndexDemoRequests = ({
    page = 1,
    limit = 20,
    status = "",
    search = "",
}: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
} = {}) =>
    useQuery<IPaginate<IDemoRequest>>({
        queryKey: [QUERY_KEY, page, limit, status, search],
        queryFn: async () => {
            const params: Record<string, unknown> = { page, limit };
            if (status) params.status = status;
            if (search) params.search = search;
            const res = await superAdminAxios.get(url, { params });
            return res.data as IPaginate<IDemoRequest>;
        },
        staleTime: 15_000,
    });

export const useUpdateDemoRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: IUpdateDemoRequestPayload }) =>
            superAdminAxios.put(`${url}/${id}`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};
