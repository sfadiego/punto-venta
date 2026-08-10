import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { superAdminAxios } from "@/contexts/SuperAdminContext";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { SubscriptionStatusEnum } from "@/enums/SubscriptionStatusEnum";
import { SubscriptionPlanEnum } from "@/enums/SubscriptionPlanEnum";
import { ITenantWithSubscription, ISubscription } from "@/models/ISubscription";

const url = ApiRoutes.SuperAdminSubscription;
const QUERY_KEY = "super-admin-subscriptions";

export const useListSubscriptions = (status?: SubscriptionStatusEnum, isDemo?: boolean) =>
    useQuery<ITenantWithSubscription[]>({
        queryKey: [QUERY_KEY, status, isDemo],
        queryFn: async () => {
            const params: Record<string, unknown> = {};
            if (status) params.status = status;
            if (isDemo !== undefined) params.is_demo = isDemo;
            const res = await superAdminAxios.get(url, { params });
            return res.data.data as ITenantWithSubscription[];
        },
    });

export const useMrr = () =>
    useQuery<{ total_monthly_revenue: number }>({
        queryKey: [QUERY_KEY, "mrr"],
        queryFn: async () => {
            const res = await superAdminAxios.get(`${url}/mrr`);
            return res.data.data as { total_monthly_revenue: number };
        },
    });

export const useGetSubscriptionHistory = (tenantId: number | null) =>
    useQuery<ISubscription[]>({
        queryKey: [QUERY_KEY, "history", tenantId],
        queryFn: async () => {
            const res = await superAdminAxios.get(`${url}/${tenantId}/history`);
            return res.data.data as ISubscription[];
        },
        enabled: tenantId !== null,
    });

export interface RegisterPaymentPayload {
    plan: SubscriptionPlanEnum;
    starts_at: string;
    amount?: number | null;
    notes?: string | null;
}

export const useRegisterPayment = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ tenantId, data }: { tenantId: number; data: RegisterPaymentPayload }) =>
            superAdminAxios.post(`${url}/${tenantId}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};
