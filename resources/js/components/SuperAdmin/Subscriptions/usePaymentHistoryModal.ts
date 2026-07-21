import { useGetSubscriptionHistory } from "@/services/useSubscriptionService";
import { ITenantWithSubscription } from "@/models/ISubscription";

export const usePaymentHistoryModal = (tenant: ITenantWithSubscription | null) => {
    const { data = [], isLoading } = useGetSubscriptionHistory(tenant?.id ?? null);

    return { records: data, isLoading };
};
