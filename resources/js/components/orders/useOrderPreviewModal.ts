import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useShowOrder, useUpdateOrder } from "@/services/useOrderService";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

export const useOrderPreviewModal = (orderId: number) => {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: order, isLoading } = useShowOrder(isOpen ? orderId : 0);
    const { mutate: updateOrder, isPending: isUpdatingStatus } = useUpdateOrder(orderId);

    const markReadyToServe = () => {
        updateOrder(
            { estatus_pedido_id: OrderStatusEnum.ReadyToServe },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Orders}/${orderId}`] });
                    queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
                    queryClient.invalidateQueries({ queryKey: [ApiRoutes.Orders] });
                    toast.success("Orden lista para servir");
                    setIsOpen(false);
                },
                onError: () => {
                    toast.error("Error al actualizar el estado");
                },
            }
        );
    };

    const isReadyToServe = order?.estatus_pedido_id === OrderStatusEnum.ReadyToServe;

    return {
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        products: order?.order_products ?? [],
        isLoading,
        isReadyToServe,
        isUpdatingStatus,
        markReadyToServe,
    };
};
