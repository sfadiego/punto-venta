import { useIndexOrder } from "@/services/useOrderService";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";

export const useCloseSalesOrdersGuard = (sistemaId: number | null) => {
    const { data: activeOrdersPage } = useIndexOrder({
        sistema_id: sistemaId,
        estatus_pedido_id: OrderStatusEnum.InProcess,
        limit: 1,
    });

    const { data: pendingOrdersPage } = useIndexOrder({
        sistema_id: sistemaId,
        estatus_pedido_id: OrderStatusEnum.PendingConfirmation,
        limit: 1,
    });

    const { data: servedOrdersPage } = useIndexOrder({
        sistema_id: sistemaId,
        estatus_pedido_id: OrderStatusEnum.Served,
        limit: 1,
    });

    const activeOrdersCount =
        (activeOrdersPage?.total ?? 0) +
        (pendingOrdersPage?.total ?? 0) +
        (servedOrdersPage?.total ?? 0);

    return {
        activeOrdersCount,
        hasActiveOrders: activeOrdersCount > 0,
    };
};
