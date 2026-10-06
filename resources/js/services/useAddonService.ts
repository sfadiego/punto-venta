import { axiosDELETE, axiosGET, axiosPUT, useGET, usePOST } from "@/hooks/useApi";
import { useAxios } from "@/hooks/useAxios";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IAddon, IAddonFormPayload } from "@/models/IAddon";
import { IPaginate } from "@/intefaces/IPaginate";
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";

const url = ApiRoutes.Addon;

// Invalida la lista paginada (modal de catálogo), la liviana (checklist del producto) y los
// productos — cada producto trae sus `addons` embebidos, así que un cambio de nombre/precio
// o un borrado debe refrescar también ese caché.
export const invalidateAddonQueries = (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: [url] });
    queryClient.invalidateQueries({ queryKey: [`${url}/list`] });
    queryClient.invalidateQueries({ queryKey: [`${url}/show`] });
    queryClient.invalidateQueries({ queryKey: [ApiRoutes.Product] });
};

// Paginado — lista del modal de administración de toppings.
export const useIndexAddonsPaginated = ({
    page = 1,
    limit = 10,
    search = "",
    enabled = true,
}: { page?: number; limit?: number; search?: string; enabled?: boolean } = {}) =>
    useGET<IPaginate<IAddon>>({
        url,
        nameQuery: url,
        filters: { page, limit, ...(search ? { search } : {}) },
        enable: enabled,
    });

// Lista liviana sin paginar (solo activos) — checklist del formulario de producto y
// selector de venta. `enabled` evita dispararla en negocios donde la feature no aplica.
export const useAddonList = (enabled = true) => {
    const { axiosApi } = useAxios();
    return useQuery<IAddon[]>({
        queryKey: [`${url}/list`],
        queryFn: () => axiosGET(axiosApi, { url: `${url}/list` }),
        enabled,
        refetchOnWindowFocus: false,
    });
};

// El backend envuelve la respuesta en { status, message, data } (Response::success).
export const useStoreAddon = () => usePOST<{ data: IAddon }>({ url });

// El id del topping se conoce recién al abrir el modal de edición/borrado de una fila,
// por eso va en las variables del mutate y no en la URL fija del hook.
export const useUpdateAddon = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({ addonId, data }: { addonId: number; data: Partial<IAddonFormPayload> }) =>
            axiosPUT(axiosApi, { url: `${url}/${addonId}`, data }),
    });
};

export const useDeleteAddon = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: (addonId: number) => axiosDELETE(axiosApi, { url: `${url}/${addonId}` }),
    });
};

// Detalle del topping con los ids de los productos donde se ofrece (panel de asignación).
export const useShowAddon = (addonId: number | null) => {
    const { axiosApi } = useAxios();
    return useQuery<IAddon>({
        queryKey: [`${url}/show`, addonId],
        queryFn: () => axiosGET(axiosApi, { url: `${url}/${addonId}` }),
        enabled: addonId !== null,
        refetchOnWindowFocus: false,
        // Sin caché entre aperturas: el panel siembra su selección local con estos ids y un
        // dato viejo mostraría casillas desactualizadas.
        gcTime: 0,
    });
};

// Reemplaza el conjunto completo de productos del topping (asignación masiva desde el catálogo).
export const useSyncAddonProducts = () => {
    const { axiosApi } = useAxios();
    return useMutation({
        mutationFn: ({ addonId, productIds }: { addonId: number; productIds: number[] }) =>
            axiosPUT(axiosApi, { url: `${url}/${addonId}/products`, data: { product_ids: productIds } }),
    });
};
