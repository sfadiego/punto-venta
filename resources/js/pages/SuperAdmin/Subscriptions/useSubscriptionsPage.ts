import { useState } from "react";
import { SubscriptionStatusEnum } from "@/enums/SubscriptionStatusEnum";
import { ITenantWithSubscription } from "@/models/ISubscription";
import { useListSubscriptions } from "@/services/useSubscriptionService";

export const useSubscriptionsPage = () => {
    const [statusFilter, setStatusFilter] = useState<SubscriptionStatusEnum | "">("");
    const [selectedTenant, setSelectedTenant] = useState<ITenantWithSubscription | null>(null);
    const [historyTenant, setHistoryTenant] = useState<ITenantWithSubscription | null>(null);

    const { data = [], isLoading } = useListSubscriptions(
        statusFilter ? (statusFilter as SubscriptionStatusEnum) : undefined,
    );

    const filtered = statusFilter
        ? data.filter((t) => t.subscription_status === statusFilter)
        : data;

    const openModal  = (tenant: ITenantWithSubscription) => setSelectedTenant(tenant);
    const closeModal = () => setSelectedTenant(null);

    const openHistory  = (tenant: ITenantWithSubscription) => setHistoryTenant(tenant);
    const closeHistory = () => setHistoryTenant(null);

    const summary = {
        total:   data.length,
        active:  data.filter((t) => t.subscription_status === SubscriptionStatusEnum.Active).length,
        expired: data.filter((t) => t.subscription_status === SubscriptionStatusEnum.Expired).length,
        pending: data.filter((t) => t.subscription_status === SubscriptionStatusEnum.Pending).length,
        grace:   data.filter((t) => t.subscription_status === SubscriptionStatusEnum.Grace).length,
    };

    return {
        filtered, isLoading, statusFilter, setStatusFilter,
        selectedTenant, openModal, closeModal,
        historyTenant, openHistory, closeHistory,
        summary,
    };
};
