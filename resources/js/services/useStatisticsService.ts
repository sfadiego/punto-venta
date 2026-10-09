import { QueryClient } from "@tanstack/react-query";
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
    // Ingresos y ventas netas de devoluciones: `total_returns` es lo reembolsado de esas ventas (ya descontado).
    total_revenue: number;
    total_returns: number;
    orders_count: number;
    average_ticket: number;
}

const url = ApiRoutes.Statistics;
export const useBestSeller = (date?: string, period?: "day" | "month", sistemaId?: number | null, branchId?: number | null) =>
    useGET<IBestSellerItem[]>({
        url: `${url}/best-seller`,
        nameQuery: `${url}/best-seller`,
        filters: {
            ...(date ? { date } : {}),
            ...(date && period ? { period } : {}),
            ...(sistemaId ? { sistema_id: sistemaId } : {}),
            ...(branchId ? { branch_id: branchId } : {}),
        },
    });

export const useAverageTicket = (date?: string, sistemaId?: number | null, branchId?: number | null) =>
    useGET<IAverageTicket>({
        url: `${url}/average-ticket`,
        nameQuery: `${url}/average-ticket`,
        filters: {
            ...(date ? { date } : {}),
            ...(sistemaId ? { sistema_id: sistemaId } : {}),
            ...(branchId ? { branch_id: branchId } : {}),
        },
    });

// Ninguna venta invalidaba estas dos queries — se quedaban con el staleTime global de 2 min
// hasta que el usuario recargaba la página a mano. Llamar después de cerrar/crear una venta,
// mismo patrón que invalidateSalesByCategory. nameQuery aquí es la ruta pelada (no un string
// compuesto), así que basta con la queryKey exacta para que el prefix-match de TanStack Query
// alcance ambas (best-seller y average-ticket ya vienen con sus propios filtros como segundo
// elemento del arreglo).
export const invalidateStatistics = (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: [`${url}/best-seller`] });
    queryClient.invalidateQueries({ queryKey: [`${url}/average-ticket`] });
    // Una venta a crédito cambia el adeudo del cliente y cualquier venta mueve el stock y la última venta
    // de sus productos — sin esto, estas secciones de Estadísticas mostraban datos de hasta 2 minutos antes.
    queryClient.invalidateQueries({ queryKey: [ApiRoutes.StatisticsTopDebtors] });
    queryClient.invalidateQueries({ queryKey: [ApiRoutes.StatisticsSlowMoving] });
    queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.StatisticsSlowMoving}/summary`] });
};
