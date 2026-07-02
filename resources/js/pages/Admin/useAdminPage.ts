import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { useAxios } from "@/hooks/useAxios";

export const useAdminPage = () => {
    const { data: config, isLoading } = useGetBusinessConfig();
    const { features } = useAxios();
    const sellByWeight = features?.sell_by_weight ?? false;

    return { config, isLoading, sellByWeight };
};
