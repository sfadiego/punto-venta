import { useAxios } from "@/hooks/useAxios";
import { useIndexOrder } from "@/services/useOrderService";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";

const today = () => new Date().toISOString().split("T")[0];

export const useRecentSales = () => {
    const { sistemaId, features } = useAxios();
    const sellByWeight = features?.sell_by_weight === true;

    const { data, isLoading } = useIndexOrder({
        sistema_id: sistemaId,
        estatus_pedido_id: sellByWeight ? undefined : OrderStatusEnum.Closed,
        fecha: today(),
        limit: 20,
        order: "desc",
    });

    return {
        sales: data?.data ?? [],
        total: data?.total ?? 0,
        isLoading,
        sistemaId,
        sellByWeight,
    };
};
