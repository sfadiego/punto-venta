import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAxios } from "@/hooks/useAxios";
import { useOptimisticPendingSet } from "@/hooks/useOptimisticPendingSet";
import { IOrder } from "@/models/IOrder";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IPaginate } from "@/intefaces/IPaginate";
import { useIndexPendingOrders, useUpdateOrderStatus } from "@/services/useOrderService";
import { logUnexpectedError } from "@/plugins/logger.plugin";

export const usePendingOrders = () => {
    const { sistemaId } = useAxios();
    const queryClient = useQueryClient();

    const { data, isLoading } = useIndexPendingOrders(sistemaId);
    const { mutateAsync: updateStatus } = useUpdateOrderStatus();

    const { pendingIds, isPending, withPending } = useOptimisticPendingSet<number>();

    const orders: IOrder[] = (data as IPaginate<IOrder> | undefined)?.data ?? [];

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["pending-orders"] });
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Orders] });
        queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
    };

    const handleAccept = async (order: IOrder) => {
        if (isPending(order.id)) return;
        try {
            await withPending([order.id], () =>
                updateStatus({
                    orderId: order.id,
                    statusId: OrderStatusEnum.InProcess,
                    extra: { nombre_pedido: order.nombre_pedido ?? "" },
                }),
            );
            toast.success(`Pedido de ${order.nombre_pedido ?? "cliente"} aceptado`);
            invalidate();
        } catch (error) {
            logUnexpectedError(error, "usePendingOrders.handleAccept");
            toast.error("No se pudo aceptar el pedido");
        }
    };

    const handleReject = async (order: IOrder) => {
        if (isPending(order.id)) return;
        try {
            await withPending([order.id], () =>
                updateStatus({ orderId: order.id, statusId: OrderStatusEnum.Canceled }),
            );
            toast.info(`Pedido de ${order.nombre_pedido ?? "cliente"} rechazado`);
            invalidate();
        } catch (error) {
            logUnexpectedError(error, "usePendingOrders.handleReject");
            toast.error("No se pudo rechazar el pedido");
        }
    };

    return {
        orders,
        isLoading,
        pendingIds,
        handleAccept,
        handleReject,
    };
};
