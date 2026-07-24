import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosGET, usePOST, axiosPUT, axiosDELETE } from "@/hooks/useApi";
import { useAxios } from "@/hooks/useAxios";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { getCachedBusinessConfig, setCachedBusinessConfig } from "@/utils/businessConfigCache";

const url = ApiRoutes.BusinessConfig;
const QUERY_KEY = "business-config";

// initialData desde localStorage evita el flash de colores/settings default en cada
// reload: React arranca ya pintado con la última config conocida del tenant mientras
// la petición fresca resuelve en segundo plano (ver index.blade.php para el caso
// previo al montaje de React).
export const useGetBusinessConfig = () => {
    const { axiosApi } = useAxios();

    const query = useQuery<IBusinessConfig>({
        queryKey: [QUERY_KEY, {}],
        queryFn: async () => axiosGET<object>(axiosApi, { url }),
        retry: false,
        refetchOnWindowFocus: false,
        initialData: () => getCachedBusinessConfig() ?? undefined,
    });

    useEffect(() => {
        if (query.data) setCachedBusinessConfig(query.data);
    }, [query.data]);

    return query;
};

export const useUpdateBusinessConfig = () => {
    const { axiosApi } = useAxios();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Omit<IBusinessConfig, "id" | "slug" | "logo_path" | "logo_upload_enabled" | "bluetooth_printing_enabled" | "created_at" | "updated_at">) =>
            axiosPUT(axiosApi, { url, data }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};

export const useUploadLogo = () => {
    const queryClient = useQueryClient();
    return usePOST<FormData>({
        url: `${url}/logo`,
        isFile: true,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};

export const useRemoveLogo = () => {
    const { axiosApi } = useAxios();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => axiosDELETE(axiosApi, { url: `${url}/logo` }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};
