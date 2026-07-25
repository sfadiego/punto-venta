import { useQueryClient } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

export const useInvalidateOrder = (orderId: number) => {
    const queryClient = useQueryClient();
    return () =>
        queryClient.invalidateQueries({
            queryKey: [`${ApiRoutes.Orders}/${orderId}`],
        });
};
