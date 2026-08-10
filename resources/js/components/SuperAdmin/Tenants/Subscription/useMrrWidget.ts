import { useMrr } from "@/services/useSubscriptionService";

export const useMrrWidget = () => {
    const { data, isLoading } = useMrr();

    return {
        totalMonthlyRevenue: data?.total_monthly_revenue ?? 0,
        isLoading,
    };
};
