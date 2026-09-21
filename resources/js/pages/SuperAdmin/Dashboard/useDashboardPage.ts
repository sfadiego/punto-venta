import { useGetDashboardSummary } from "@/services/useDashboardService";

export const useDashboardPage = () => {
    const { data, isLoading } = useGetDashboardSummary();

    return { summary: data, isLoading };
};
