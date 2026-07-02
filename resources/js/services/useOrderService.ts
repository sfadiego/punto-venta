import { IPaginate } from "@/intefaces/IPaginate";
import { axiosGET, axiosPUT, axiosDELETE, useDELETE, useGET, usePOST, usePUT } from "../hooks/useApi";
import { IOrder } from "@/models/IOrder";
import { IOrderProduct } from "@/models/IOrderProduct";
import { IPaginateServiceProps } from "@/intefaces/IPaginateServiceProps";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
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
    categoria_id,
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
            ...(categoria_id ? { categoria_id } : {}),
        },
        enable: sistema_id !== null,
    });

export const useInfiniteIndexOrder = (sistemaId: number | null) => {
    const { axiosApi } = useAxios();
    return useInfiniteQuery<IPaginate<IOrder>>({
        queryKey: ["orders-infinite", { sistemaId }],
        queryFn: async ({ pageParam }) =>
            axiosGET(axiosApi, {
                url,
                params: { page: pageParam, limit: 5, order: "desc", sistema_id: sistemaId },
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.current_page < lastPage.last_page
                ? lastPage.current_page + 1
                : undefined,
        enabled: sistemaId !== null,
        refetchInterval: 10_000,
    });
};

export const useStoreOrder = () => usePOST({ url });
export const useShowOrder = (orderId: number) =>
    useGET<IOrder>({ url: `${url}/${orderId}`, enable: !!orderId });

export const useIndexOrderProducts = (orderId: number) =>
    useGET<IOrderProduct[]>({ url: `${url}/${orderId}/product`, enable: !!orderId });

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
        mutationFn: ({ productId, data }: { productId: number; data: Record<string, unknown> }) =>
            axiosPUT(axiosApi, { url: `${url}/${orderId}/product/${productId}`, data }),
    });
};

export const useDeleteProductInOrder = (orderId: number) => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: (productId: number) =>
            axiosDELETE(axiosApi, { url: `${url}/${orderId}/product/${productId}` }),
    });
};

// Deletes any order_product by its own id (works for both products and extras)
export const useDeleteItemFromOrder = (orderId: number) => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: (orderProductId: number) =>
            axiosDELETE(axiosApi, { url: `${url}/${orderId}/extra/${orderProductId}` }),
    });
};

// Updates observacion on any order_product by order_product.id (works for products and extras)
export const useUpdateOrderProductNote = (orderId: number) => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({ orderProductId, observacion }: { orderProductId: number; observacion: string }) =>
            axiosPUT(axiosApi, { url: `${url}/${orderId}/product/${orderProductId}/note`, data: { observacion } }),
    });
};
