import { IPaginate } from "@/intefaces/IPaginate";
import { IPaginateServiceProps } from "@/intefaces/IPaginateServiceProps";
import {
    axiosGET,
    axiosPATCH,
    axiosPOST,
    axiosPUT,
    axiosDELETE,
    useDELETE,
    useGET,
    usePOST,
    usePUT,
} from "../hooks/useApi";
import { IOrder, IOrderSummary } from "@/models/IOrder";
import { IOrderProduct } from "@/models/IOrderProduct";
import { IOrderReturnPayload } from "@/models/IOrderReturn";
import { invalidateCustomerQueries } from "@/services/useCustomerService";
import { invalidateSalesByCategory } from "@/services/useSalesByCategoryService";
import { invalidateStatistics } from "@/services/useStatisticsService";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { QueryClient, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAxios } from "@/hooks/useAxios";

const url = ApiRoutes.Orders;
export const useIndexOrder = ({
    filters = [],
    order = "desc",
    page = 1,
    limit = 10,
    sistema_id,
    estatus_pedido_id,
    fecha,
    semana,
    mes,
    categoria_id,
    search,
    branch_id,
    strict_status,
    layaways_only,
}: IPaginateServiceProps) =>
    useGET<IPaginate<IOrder>>({
        url,
        filters: {
            filters,
            order,
            page,
            limit,
            ...(sistema_id ? { sistema_id } : {}),
            ...(estatus_pedido_id ? { estatus_pedido_id } : {}),
            ...(fecha ? { fecha } : {}),
            ...(semana ? { semana } : {}),
            ...(mes ? { mes } : {}),
            ...(categoria_id ? { categoria_id } : {}),
            ...(search ? { search } : {}),
            ...(branch_id ? { branch_id } : {}),
            ...(strict_status ? { strict_status: 1 } : {}),
            ...(layaways_only ? { layaways_only: 1 } : {}),
        },
        enable: sistema_id !== null,
    });

export const useInfiniteIndexOrder = (sistemaId: number | null, branchId?: number | null) => {
    const { axiosApi } = useAxios();
    return useInfiniteQuery<IPaginate<IOrder>>({
        queryKey: ["orders-infinite", { sistemaId, branchId }],
        queryFn: async ({ pageParam }) =>
            axiosGET(axiosApi, {
                url,
                params: {
                    page: pageParam,
                    limit: 5,
                    order: "desc",
                    sistema_id: sistemaId,
                    ...(branchId ? { branch_id: branchId } : {}),
                },
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.current_page < lastPage.last_page
                ? lastPage.current_page + 1
                : undefined,
        enabled: sistemaId !== null,
        // Sin refetchInterval: useOrdersSocket ya refresca esta misma query (queryKey
        // "orders-infinite") en cada evento .orders.updated del WebSocket — el poll de 60s
        // era tráfico duplicado sobre un canal que ya funciona, multiplicado por cada
        // Dashboard abierto en modo restaurante.
    });
};

// Invalida las listas de órdenes directamente en vez de depender solo del WebSocket
// (useOrdersSocket) — si Reverb no está corriendo o el evento se pierde, el usuario que
// creó la orden debe ver su propia lista actualizada de todos modos.
export const useStoreOrder = () => {
    const queryClient = useQueryClient();
    return usePOST({
        url,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [url] });
            queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
        },
    });
};
// Venta directa — crea la orden + productos + la cierra en un solo paso (OrderSaleService::createDirectSale).
export const useStoreOrderSale = () => usePOST({ url: `${url}/sale` });
// `fresh` salta la caché (staleTime 0): para flujos que deciden con datos que cambian fuera de la orden — la
// devolución usa el saldo del cliente y lo ya devuelto, que se mueven al abonar o devolver desde otra pantalla.
export const useShowOrder = (orderId: number, enabled = true, { fresh = false }: { fresh?: boolean } = {}) =>
    useGET<IOrder>({ url: `${url}/${orderId}`, enable: !!orderId && enabled, ...(fresh ? { staleTime: 0 } : {}) });

// Combobox de devolución (módulo de Inventario) — a diferencia de useIndexOrder, no está
// acotado a la sesión de caja activa: busca entre TODAS las órdenes cerradas del tenant, de
// cualquier fecha/sesión (OrderController::listClosed).
export const useListClosedOrders = (search: string, enabled = true) =>
    useGET<IOrderSummary[]>({
        url: `${url}/closed-list`,
        filters: search ? { search } : {},
        enable: enabled,
    });

export const useIndexOrderProducts = (orderId: number) =>
    useGET<IOrderProduct[]>({
        url: `${url}/${orderId}/product`,
        enable: !!orderId,
    });

export const useGetProductInOrder = (orderId: number, productId: number) =>
    useGET({ url: `${url}/${orderId}/product/${productId}` });
export const useUpdateOrder = (orderId: number) =>
    usePUT({
        url: `${url}/${orderId}`,
    });

export const useAddProductToOrder = (orderId: number) =>
    usePOST({ url: `${url}/${orderId}/product` });

export const useDeleteOrder = (orderId: number) =>
    useDELETE({ url: `${url}/${orderId}` });

export const useIndexPrintOrder = (orderId: number) =>
    usePOST({ url: `${url}/${orderId}/print` });

export const useUpdateProductInOrder = (orderId: number) => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({
            orderProductId,
            data,
        }: {
            orderProductId: number;
            data: Record<string, unknown>;
        }) =>
            axiosPUT(axiosApi, {
                url: `${url}/${orderId}/product/${orderProductId}`,
                data,
            }),
    });
};

export const useDeleteProductInOrder = (orderId: number) => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: (productId: number) =>
            axiosDELETE(axiosApi, {
                url: `${url}/${orderId}/product/${productId}`,
            }),
    });
};

// Deletes any order_product by its own id (works for both products and extras)
export const useDeleteItemFromOrder = (orderId: number) => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: (orderProductId: number) =>
            axiosDELETE(axiosApi, {
                url: `${url}/${orderId}/extra/${orderProductId}`,
            }),
    });
};

export const useClearCartFromOrder = (orderId: number) =>
    useDELETE({ url: `${url}/${orderId}/clear-cart` });

// Updates observacion on any order_product by order_product.id (works for products and extras)
export const useUpdateOrderProductNote = (orderId: number) => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({
            orderProductId,
            observacion,
        }: {
            orderProductId: number;
            observacion: string;
        }) =>
            axiosPUT(axiosApi, {
                url: `${url}/${orderId}/product/${orderProductId}/note`,
                data: { observacion },
            }),
    });
};

// Toggles is_ready on any order_product by order_product.id
export const useToggleOrderProductReady = (orderId: number) => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: (orderProductId: number) =>
            axiosPATCH(axiosApi, {
                url: `${url}/${orderId}/product/${orderProductId}/ready`,
                data: {},
            }),
    });
};

export const useIndexPendingOrders = (sistemaId: number | null) =>
    useGET<IPaginate<IOrder>>({
        url,
        nameQuery: "pending-orders",
        filters: {
            sistema_id: sistemaId,
            estatus_pedido_id: OrderStatusEnum.PendingConfirmation,
            limit: 50,
            order: "asc",
        },
        enable: sistemaId !== null,
    });

export const useUpdateOrderStatus = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({
            orderId,
            statusId,
            extra,
        }: {
            orderId: number;
            statusId: number;
            extra?: Record<string, unknown>;
        }) =>
            axiosPUT(axiosApi, {
                url: `${url}/${orderId}`,
                data: { estatus_pedido_id: statusId, ...extra },
            }),
    });
};

// Variantes con orderId dinámico (pasado en cada llamada, no fijado al crear el hook).
// Usar cuando la orden se crea de forma lazy en medio del flujo, donde el id recién creado
// debe usarse en la misma función async sin esperar un re-render.

export const useUpdateOrderData = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({ orderId, data }: { orderId: number; data: Record<string, unknown> }) =>
            axiosPUT(axiosApi, { url: `${url}/${orderId}`, data }),
    });
};

export const useDeleteOrderById = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: (orderId: number) => axiosDELETE(axiosApi, { url: `${url}/${orderId}` }),
    });
};

export const useCreateOrderProduct = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({ orderId, data }: { orderId: number; data: Record<string, unknown> }) =>
            axiosPOST(axiosApi, { url: `${url}/${orderId}/product`, data }),
    });
};

// Alta en lote — todo el carrito en un solo request (ver OrderProductService::addProducts).
// Usado por el checkout de QuickSale en vez de llamar useCreateOrderProduct una vez por línea.
export const useCreateOrderProducts = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({ orderId, items }: { orderId: number; items: Record<string, unknown>[] }) =>
            axiosPOST(axiosApi, { url: `${url}/${orderId}/products`, data: { items } }),
    });
};

export const useUpdateOrderProduct = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({
            orderId,
            orderProductId,
            data,
        }: {
            orderId: number;
            orderProductId: number;
            data: Record<string, unknown>;
        }) =>
            axiosPUT(axiosApi, {
                url: `${url}/${orderId}/product/${orderProductId}`,
                data,
            }),
    });
};

export const useDeleteOrderItem = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({ orderId, orderProductId }: { orderId: number; orderProductId: number }) =>
            axiosDELETE(axiosApi, { url: `${url}/${orderId}/extra/${orderProductId}` }),
    });
};

// Devolución de una o varias líneas de una orden cerrada (módulo de Inventario, exclusivo retail).
// Cada item usa el id de la línea order_product (no el del producto de catálogo). El backend la
// aplica completa o no la aplica: valida que la orden esté cerrada y que ninguna cantidad exceda
// lo vendido menos lo ya devuelto.
// Una devolución toca stock (productos y kardex), la orden, la caja (reembolso), el saldo del cliente
// (venta a crédito) y los reportes — se refresca todo sin importar desde qué pantalla se hizo.
export const invalidateOrderReturnQueries = (
    queryClient: QueryClient,
    { orderId, sistemaId, customerId }: { orderId: number; sistemaId?: number | null; customerId?: number | null },
) => {
    queryClient.invalidateQueries({ queryKey: [ApiRoutes.Product] });
    queryClient.invalidateQueries({ queryKey: [ApiRoutes.Kardex] });
    queryClient.invalidateQueries({ queryKey: [ApiRoutes.Orders] });
    queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
    // useShowOrder cachea con la key exacta "order/{id}" — sin esto, una segunda devolución parcial
    // sobre la misma orden (dentro del staleTime de 2 min) ve las líneas con la cantidad ya devuelta
    // desactualizada.
    queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Orders}/${orderId}`] });
    if (sistemaId) {
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.System}/${sistemaId}/total-current-sales`] });
    }
    invalidateCustomerQueries(queryClient);
    // Detalle del cliente (clave propia): su saldo y su historial de devoluciones cambian en ventas a crédito.
    if (customerId) {
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Customer}/${customerId}`] });
    }
    invalidateSalesByCategory(queryClient);
    invalidateStatistics(queryClient);
};

export const useCreateOrderReturn = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({ orderId, data }: { orderId: number; data: IOrderReturnPayload }) =>
            axiosPOST(axiosApi, { url: `${url}/${orderId}/return`, data }),
    });
};

export const useClearOrderCart = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: (orderId: number) => axiosDELETE(axiosApi, { url: `${url}/${orderId}/clear-cart` }),
    });
};

// Ticket a imprimir: el de la orden o, con `returnId`, el comprobante de esa devolución.
export interface IPrintTarget {
    orderId: number;
    returnId?: number;
}

const printUrl = ({ orderId, returnId }: IPrintTarget) =>
    returnId ? `${url}/${orderId}/return/${returnId}/print` : `${url}/${orderId}/print`;

export const usePrintOrder = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: (target: IPrintTarget) => axiosPOST(axiosApi, { url: printUrl(target), data: {} }),
    });
};

export const useFetchPrintBytes = () => {
    const { axiosApi } = useAxios();
    return (target: IPrintTarget) =>
        axiosGET<ArrayBuffer>(axiosApi, {
            url: target.returnId ? `${printUrl(target)}/bytes` : ApiRoutes.PrintBytes.replace(":id", String(target.orderId)),
            responseType: "arraybuffer",
        });
};

export const useFetchPrintTestBytes = () => {
    const { axiosApi } = useAxios();
    return () =>
        axiosGET<ArrayBuffer>(axiosApi, {
            url: ApiRoutes.PrintTestBytes,
            responseType: "arraybuffer",
        });
};

export const useExportSalesReport = () => {
    const { axiosApi } = useAxios();
    return (params: {
        sistema_id?: number | null;
        fecha?: string | null;
        semana?: string | null;
        mes?: string | null;
    }): Promise<Blob> =>
        axiosGET(axiosApi, {
            url: ApiRoutes.OrderSalesReportExport,
            params,
            responseType: "blob",
        });
};
