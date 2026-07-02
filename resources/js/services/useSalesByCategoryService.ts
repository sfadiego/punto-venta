import { useGET } from "@/hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { ISalesByCategory } from "@/models/ISalesByCategory";

export const useSalesByCategory = (sistemaId: number | null) =>
    useGET<ISalesByCategory[]>({
        url: ApiRoutes.OrderSalesByCategory,
        filters: { sistema_id: sistemaId },
        enable: !!sistemaId,
        nameQuery: `${ApiRoutes.OrderSalesByCategory}-${sistemaId}`,
    });
