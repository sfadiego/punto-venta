import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePOST } from "@/hooks/useApi";
import { superAdminAxios } from "@/contexts/SuperAdminContext";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IPaginate } from "@/intefaces/IPaginate";
import {
    ICreateDemoRequestPayload,
    IClientLead,
    IClientLeadCreatePayload,
    IUpdateClientLeadPayload,
} from "@/models/IClientLead";

// Público — usado desde AuthPage (sin sesión de tenant ni de super-admin)
export const useCreateDemoRequest = () =>
    usePOST<ICreateDemoRequestPayload>({ url: ApiRoutes.DemoRequest });

// Super-admin — panel de seguimiento de clientes
const url = ApiRoutes.SuperAdminClientLeads;
const QUERY_KEY = "super-admin-client-leads";

export const useIndexClientLeads = ({
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
    useQuery<IPaginate<IClientLead>>({
        queryKey: [QUERY_KEY, page, limit, status, search],
        queryFn: async () => {
            const params: Record<string, unknown> = { page, limit };
            if (status) params.status = status;
            if (search) params.search = search;
            const res = await superAdminAxios.get(url, { params });
            return res.data as IPaginate<IClientLead>;
        },
        staleTime: 15_000,
    });

export const useCreateClientLead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: IClientLeadCreatePayload) => superAdminAxios.post(url, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};

export const useUpdateClientLead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: IUpdateClientLeadPayload }) =>
            superAdminAxios.put(`${url}/${id}`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};
