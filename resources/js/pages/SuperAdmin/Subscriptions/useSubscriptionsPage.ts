import { useState } from "react";
import { SubscriptionStatusEnum } from "@/enums/SubscriptionStatusEnum";
import { TenantDemoFilterEnum } from "@/enums/TenantDemoFilterEnum";
import { ITenantWithSubscription } from "@/models/ISubscription";
import { useListSubscriptions } from "@/services/useSubscriptionService";

const toIsDemo = (filter: TenantDemoFilterEnum): boolean | undefined =>
    filter === TenantDemoFilterEnum.Demo ? true : undefined;

export const useSubscriptionsPage = () => {
    const [statusFilter, setStatusFilter] = useState<SubscriptionStatusEnum | "">("");
    const [demoFilter, setDemoFilter] = useState<TenantDemoFilterEnum>(TenantDemoFilterEnum.All);
    const [selectedTenant, setSelectedTenant] = useState<ITenantWithSubscription | null>(null);
    const [historyTenant, setHistoryTenant] = useState<ITenantWithSubscription | null>(null);

    const { data = [], isLoading } = useListSubscriptions(
        statusFilter ? (statusFilter as SubscriptionStatusEnum) : undefined,
        toIsDemo(demoFilter),
    );

    // Dataset fijo de clientes reales, independiente del filtro de listado activo —
    // los widgets de resumen nunca deben verse afectados por el filtro (ej. al ver "Demo").
    const { data: realTenants = [] } = useListSubscriptions(undefined, false);

    const filtered = statusFilter
        ? data.filter((t) => t.subscription_status === statusFilter)
        : data;

    const openModal  = (tenant: ITenantWithSubscription) => setSelectedTenant(tenant);
    const closeModal = () => setSelectedTenant(null);

    const openHistory  = (tenant: ITenantWithSubscription) => setHistoryTenant(tenant);
    const closeHistory = () => setHistoryTenant(null);

    const summary = {
        total:   realTenants.length,
        active:  realTenants.filter((t) => t.subscription_status === SubscriptionStatusEnum.Active).length,
        expired: realTenants.filter((t) => t.subscription_status === SubscriptionStatusEnum.Expired).length,
        pending: realTenants.filter((t) => t.subscription_status === SubscriptionStatusEnum.Pending).length,
        grace:   realTenants.filter((t) => t.subscription_status === SubscriptionStatusEnum.Grace).length,
    };

    return {
        filtered, isLoading, statusFilter, setStatusFilter,
        demoFilter, setDemoFilter,
        selectedTenant, openModal, closeModal,
        historyTenant, openHistory, closeHistory,
        summary,
    };
};
