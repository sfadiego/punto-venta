import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosPOST } from "@/hooks/useApi";
import { useAxios } from "@/hooks/useAxios";
import { useGET } from "@/hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { FeatureSpotlightKey } from "@/enums/FeatureSpotlightEnum";

const url = ApiRoutes.FeatureSpotlights;
const QUERY_KEY = "feature-spotlights-seen";

export const useIndexSeenFeatureSpotlights = () =>
    useGET<FeatureSpotlightKey[]>({ url: `${url}/seen`, nameQuery: QUERY_KEY });

export const useMarkFeatureSpotlightSeen = () => {
    const { axiosApi } = useAxios();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (key: FeatureSpotlightKey) =>
            axiosPOST(axiosApi, { url: `${url}/${key}/seen`, data: {} }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};
