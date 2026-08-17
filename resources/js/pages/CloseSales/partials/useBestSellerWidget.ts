import { useBestSeller } from "@/services/useStatisticsService";

export const useBestSellerWidget = (sistemaId: number | null) => {
    const { data, isLoading } = useBestSeller(undefined, undefined, sistemaId);

    const top = data?.[0] ?? null;

    return { top, isLoading };
};
