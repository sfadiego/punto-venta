import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGET, usePOST, axiosPUT, axiosDELETE } from "@/hooks/useApi";
import { useAxios } from "@/hooks/useAxios";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IBusinessConfig } from "@/models/IBusinessConfig";

const url = ApiRoutes.BusinessConfig;
const QUERY_KEY = "business-config";

export const useGetBusinessConfig = () =>
    useGET<IBusinessConfig>({ url, nameQuery: QUERY_KEY });

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
