import { useQueryClient } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

// El QueryClient global tiene staleTime de 2 min "para evitar refetch en cada navegación"
// (ver app.tsx) — sin invalidar a mano, volver a /quick-sale/:id dentro de ese lapso sirve
// la respuesta cacheada de ANTES de los cambios. useShowOrder usa `${ApiRoutes.Orders}/${orderId}`
// como query key completa (string, no arreglo jerárquico), así que invalidar el prefijo no la alcanza.
export const useInvalidateResumeOrderQueries = (resumeOrderId: number | null) => {
    const queryClient = useQueryClient();

    return () => {
        if (!resumeOrderId) return;
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Orders}/${resumeOrderId}`] });
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Orders] });
        queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
    };
};
