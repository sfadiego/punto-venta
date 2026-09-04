import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";
import { IStockMovement } from "@/models/IStockMovement";
import { axiosGET, axiosPOST, axiosPUT, axiosDELETE, useDELETE, useGET, usePOST, usePUT } from "../hooks/useApi";
import { useMutation } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IPaginateServiceProps } from "@/intefaces/IPaginateServiceProps";
import { IPaginate } from "@/intefaces/IPaginate";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAxios } from "@/hooks/useAxios";

const url = ApiRoutes.Product;
export const useIndexProducts = ({
    filters = [],
    order = "desc",
    page = 1,
    limit = 10,
    categoria_id,
    nombre,
    low_stock,
    enabled = true,
}: IPaginateServiceProps & { categoria_id?: number | null; nombre?: string; low_stock?: boolean; enabled?: boolean }) =>
    useGET<IPaginate<IProduct>>({
        url,
        filters: {
            filters,
            order,
            page,
            limit,
            ...(categoria_id ? { categoria_id } : {}),
            ...(nombre ? { nombre } : {}),
            ...(low_stock ? { low_stock: 1 } : {}),
        },
        enable: enabled,
    });
const PRODUCT_PAGE_SIZE = 24;

export const useInfiniteIndexProducts = ({
    nombre = "",
    categoria_id = null,
}: {
    nombre?: string;
    categoria_id?: number | null;
} = {}) => {
    const { axiosApi } = useAxios();
    return useInfiniteQuery<IPaginate<IProduct>>({
        queryKey: [url, "infinite", { nombre, categoria_id }],
        queryFn: ({ pageParam }) =>
            axiosGET(axiosApi, {
                url,
                params: {
                    page: pageParam as number,
                    limit: PRODUCT_PAGE_SIZE,
                    order: "asc",
                    ...(nombre ? { nombre } : {}),
                    ...(categoria_id ? { categoria_id } : {}),
                },
            }),
        getNextPageParam: (lastPage) =>
            lastPage.current_page < lastPage.last_page
                ? lastPage.current_page + 1
                : undefined,
        initialPageParam: 1,
    });
};

export const useShowProduct = (id: number) =>
    useGET<IProduct>({ url: `${url}/${id}` });
export const useGetFile = (fileName: string) =>
    useGET({ url: `files/${fileName}` });

// Admin
const adminUrl = "/api/product";
export const useUpdateProductImage = (productId: number) =>
    usePOST({ url: `${adminUrl}/${productId}/image`, isFile: true });
export const useUpdateProduct = (productId: number) =>
    usePUT({ url: `${adminUrl}/${productId}` });
export const useStoreProduct = () => usePOST({ url: adminUrl });
export const useDeleteProduct = (productId: number) =>
    useDELETE({ url: `${adminUrl}/${productId}` });

// Variantes de producto — el product_id/variant_id se conocen recién en submit
// (producto puede crearse en el mismo flujo), por eso van en las variables del mutate.
export const useIndexProductVariants = (productId: number) =>
    useGET<IProductVariant[]>({
        url: `${adminUrl}/${productId}/variant`,
        enable: !!productId,
    });

export const useStoreProductVariant = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({ productId, data }: { productId: number; data: Record<string, unknown> }) =>
            axiosPOST(axiosApi, { url: `${adminUrl}/${productId}/variant`, data }),
    });
};

export const useUpdateProductVariant = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({
            productId,
            variantId,
            data,
        }: {
            productId: number;
            variantId: number;
            data: Record<string, unknown>;
        }) => axiosPUT(axiosApi, { url: `${adminUrl}/${productId}/variant/${variantId}`, data }),
    });
};

export const useDeleteProductVariant = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({ productId, variantId }: { productId: number; variantId: number }) =>
            axiosDELETE(axiosApi, { url: `${adminUrl}/${productId}/variant/${variantId}` }),
    });
};

// Historial de movimientos (kardex) del producto, paginado con scroll infinito — más
// reciente primero.
const STOCK_MOVEMENTS_PAGE_SIZE = 20;

export const useInfiniteStockMovements = (productId: number | null, variantId?: number | null) => {
    const { axiosApi } = useAxios();
    return useInfiniteQuery<IPaginate<IStockMovement>>({
        queryKey: [adminUrl, "stock-movements", "infinite", productId, variantId ?? null],
        queryFn: ({ pageParam }) =>
            axiosGET(axiosApi, {
                url: `${adminUrl}/${productId}/stock-movements`,
                params: {
                    page: pageParam as number,
                    limit: STOCK_MOVEMENTS_PAGE_SIZE,
                    ...(variantId ? { variant_id: variantId } : {}),
                },
            }),
        getNextPageParam: (lastPage) =>
            lastPage.current_page < lastPage.last_page
                ? lastPage.current_page + 1
                : undefined,
        initialPageParam: 1,
        enabled: !!productId,
    });
};

// Ajuste manual de stock (reposición, conteo físico, merma) — productId dinámico, el mismo
// hook ajusta cualquier producto sin remontar (ej. desde un modal compartido en el listado).
// variant_id opcional en data: cuando el producto lleva stock por variante, el ajuste se
// aplica a esa variante en vez de al producto.
export const useAdjustProductStock = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({
            productId,
            data,
        }: {
            productId: number;
            data: { delta: number; note?: string; variant_id?: number };
        }) => axiosPOST(axiosApi, { url: `${adminUrl}/${productId}/stock-adjustment`, data }),
    });
};
