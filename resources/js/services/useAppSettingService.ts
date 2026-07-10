import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { superAdminAxios } from "@/contexts/SuperAdminContext";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

const url = ApiRoutes.SuperAdminSettings;
const QUERY_KEY = "app-settings";

export interface IPaymentInfo {
    bank: string;
    account: string;
    holder: string;
    concept: string;
}

export interface IAppSettings {
    logo_upload_enabled: boolean;
    payment_info: IPaymentInfo | null;
}

export const useGetAppSettings = () =>
    useQuery<IAppSettings>({
        queryKey: [QUERY_KEY],
        queryFn: async () => {
            const res = await superAdminAxios.get(url);
            return res.data.data as IAppSettings;
        },
    });

export const useUpdateAppSettings = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<IAppSettings>) => superAdminAxios.put(url, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};
