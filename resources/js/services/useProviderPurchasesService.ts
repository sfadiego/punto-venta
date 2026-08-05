import { useGET, usePOST } from "@/hooks/useApi";
import { IProviderPurchase } from "@/models/IProvider";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

const url = ApiRoutes.Provider;

export const useProviderPurchases = (
    providerId: number | null,
    date?: string | null,
    month?: string | null,
    week?: string | null,
) =>
    useGET<IProviderPurchase[]>({
        url: `${url}/${providerId}/purchase`,
        nameQuery: `${url}/${providerId ?? "none"}/purchase-${date ?? "all"}-${month ?? "all"}-${week ?? "all"}`,
        filters: {
            ...(date ? { date } : {}),
            ...(month ? { month } : {}),
            ...(week ? { week } : {}),
        },
        enable: !!providerId,
    });

export const useStoreProviderPurchase = (providerId: number) =>
    usePOST<IProviderPurchase>({ url: `${url}/${providerId}/purchase` });
