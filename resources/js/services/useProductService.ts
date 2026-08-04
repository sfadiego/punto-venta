import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";
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
}: IPaginateServiceProps & { categoria_id?: number | null; nombre?: string }) =>
    useGET<IPaginate<IProduct>>({
        url,
        filters: {
            filters,
            order,
            page,
            limit,
            ...(categoria_id ? { categoria_id } : {}),
            ...(nombre ? { nombre } : {}),
        },
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
