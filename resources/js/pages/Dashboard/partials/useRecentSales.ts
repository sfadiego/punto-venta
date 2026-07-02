import { useAxios } from "@/hooks/useAxios";
import { useIndexOrder } from "@/services/useOrderService";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";

const today = () => new Date().toISOString().split("T")[0];

export const useRecentSales = () => {
    const { sistemaId } = useAxios();

    const { data, isLoading } = useIndexOrder({
        sistema_id: sistemaId,
        estatus_pedido_id: OrderStatusEnum.Closed,
        fecha: today(),
        limit: 10,
        order: "desc",
    });

    return {
        sales: data?.data ?? [],
        total: data?.total ?? 0,
        isLoading,
        sistemaId,
    };
};
