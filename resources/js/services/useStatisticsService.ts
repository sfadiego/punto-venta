import { useGET } from "../hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";

export interface IBestSellerItem {
    id: number;
    product: string;
    total: number;
    unidad_medida: UnidadMedidaEnum;
}

export interface IAverageTicket {
    total_revenue: number;
    orders_count: number;
    average_ticket: number;
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

export const useAverageTicket = (date?: string, sistemaId?: number | null) =>
    useGET<IAverageTicket>({
        url: `${url}/average-ticket`,
        nameQuery: `${url}/average-ticket`,
        filters: {
            ...(date ? { date } : {}),
            ...(sistemaId ? { sistema_id: sistemaId } : {}),
        },
    });
