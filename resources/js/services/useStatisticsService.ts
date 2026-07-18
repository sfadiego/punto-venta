import { useGET } from "../hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";

export interface IBestSellerItem {
    id: number;
    product: string;
    total: number;
    unidad_medida: UnidadMedidaEnum;
}

const url = ApiRoutes.Statistics;
export const useBestSeller = (date?: string, period?: "day" | "month", sistemaId?: number | null) =>
    useGET<IBestSellerItem[]>({
        url: `${url}/best-seller`,
        nameQuery: `${url}/best-seller`,
        filters: {
            ...(date ? { date } : {}),
            ...(date && period ? { period } : {}),
            ...(sistemaId ? { sistema_id: sistemaId } : {}),
        },
    });
