import { useGET } from "@/hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { ISalesByCategory } from "@/models/ISalesByCategory";

export const useSalesByCategory = (sistemaId: number | null, fecha?: string | null) =>
    useGET<ISalesByCategory[]>({
        url: ApiRoutes.OrderSalesByCategory,
        filters: { sistema_id: sistemaId, ...(fecha ? { fecha } : {}) },
        enable: !!sistemaId,
        nameQuery: `${ApiRoutes.OrderSalesByCategory}-${sistemaId}-${fecha ?? "all"}`,
    });
