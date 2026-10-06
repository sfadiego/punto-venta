import { QueryClient, useMutation } from "@tanstack/react-query";
import { axiosPOST, useGET } from "@/hooks/useApi";
import { useAxios } from "@/hooks/useAxios";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import {
    ILayawayCancelPayload,
    ILayawayListSummary,
    ILayawayPaymentPayload,
    ILayawayStorePayload,
} from "@/models/ILayaway";
import { invalidateSalesByCategory } from "@/services/useSalesByCategoryService";
import { invalidateStatistics } from "@/services/useStatisticsService";

const url = ApiRoutes.Orders;
const LAYAWAY_SUMMARY_KEY = `${url}/layaways/summary`;

interface InvalidateLayawayParams {
    orderId: number;
    customerId?: number | null;
    sistemaId?: number | null;
}

// Un apartado toca stock (se descuenta al crearlo), la caja (anticipo/abonos), el cliente y las
// listas de órdenes — cualquier mutación de apartado debe refrescar todo eso, sin importar desde
// qué flujo se disparó.
export const invalidateLayawayQueries = (
    queryClient: QueryClient,
    { orderId, customerId, sistemaId }: InvalidateLayawayParams,
) => {
    queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
    queryClient.invalidateQueries({ queryKey: [ApiRoutes.Orders] });
    queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Orders}/${orderId}`] });
    queryClient.invalidateQueries({ queryKey: [LAYAWAY_SUMMARY_KEY] });
    queryClient.invalidateQueries({ queryKey: [ApiRoutes.Product] });
    queryClient.invalidateQueries({ queryKey: [ApiRoutes.Kardex] });
    if (sistemaId) {
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.System}/${sistemaId}/total-current-sales`] });
    }
    if (customerId) {
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Customer}/${customerId}`] });
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Customer] });
    }
    invalidateSalesByCategory(queryClient);
    invalidateStatistics(queryClient);
};

// El id de la orden es dinámico (se pasa en las variables del mutate) — ver patrón de
// useCreateOrderProduct en useOrderService.ts.
export const useCreateLayaway = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({ orderId, data }: { orderId: number; data: ILayawayStorePayload }) =>
            axiosPOST(axiosApi, { url: `${url}/${orderId}/layaway`, data }),
    });
};

export const useLayawaySummary = (branchId?: number | null, enabled = true) =>
    useGET<ILayawayListSummary>({
        url: LAYAWAY_SUMMARY_KEY,
        filters: branchId ? { branch_id: branchId } : {},
        enable: enabled,
    });

export const useAddLayawayPayment = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({ orderId, data }: { orderId: number; data: ILayawayPaymentPayload }) =>
            axiosPOST(axiosApi, { url: `${url}/${orderId}/layaway/payment`, data }),
    });
};

export const useCancelLayaway = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({ orderId, data }: { orderId: number; data: ILayawayCancelPayload }) =>
            axiosPOST(axiosApi, { url: `${url}/${orderId}/layaway/cancel`, data }),
    });
};
