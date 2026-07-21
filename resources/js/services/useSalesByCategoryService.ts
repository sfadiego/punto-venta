import { useGET } from "@/hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { ISalesByCategoryResponse } from "@/models/ISalesByCategory";

export const useSalesByCategory = (sistemaId: number | null, fecha?: string | null) =>
    useGET<ISalesByCategoryResponse>({
        url: ApiRoutes.OrderSalesByCategory,
        filters: { ...(sistemaId ? { sistema_id: sistemaId } : {}), ...(fecha ? { fecha } : {}) },
        enable: !!sistemaId || !!fecha,
        nameQuery: `${ApiRoutes.OrderSalesByCategory}-${sistemaId ?? "any"}-${fecha ?? "all"}`,
    });
