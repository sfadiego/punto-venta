import { QueryClient } from "@tanstack/react-query";
import { useGET } from "@/hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { ISalesByCategoryResponse } from "@/models/ISalesByCategory";

export const useSalesByCategory = (
    sistemaId: number | null,
    fecha?: string | null,
    mes?: string | null,
    semana?: string | null,
) =>
    useGET<ISalesByCategoryResponse>({
        url: ApiRoutes.OrderSalesByCategory,
        filters: {
            ...(sistemaId ? { sistema_id: sistemaId } : {}),
            ...(fecha ? { fecha } : {}),
            ...(semana ? { semana } : {}),
            ...(mes ? { mes } : {}),
        },
        enable: !!sistemaId || !!fecha || !!semana || !!mes,
        nameQuery: `${ApiRoutes.OrderSalesByCategory}-${sistemaId ?? "any"}-${fecha ?? "all"}-${semana ?? "all"}-${mes ?? "all"}`,
    });

// El nameQuery de useSalesByCategory es un string compuesto (ruta + filtros), no la ruta pelada
// — invalidateQueries({queryKey: [ApiRoutes.OrderSalesByCategory]}) nunca matchea por prefijo.
// Se necesita un predicate que compare por startsWith. Llamar después de cerrar/crear una venta
// para que el modal "Ventas por categoría" no quede con el total viejo (staleTime global de 2 min).
export const invalidateSalesByCategory = (queryClient: QueryClient) =>
    queryClient.invalidateQueries({
        predicate: (query) =>
            typeof query.queryKey[0] === "string" &&
            query.queryKey[0].startsWith(ApiRoutes.OrderSalesByCategory),
    });
