import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useShowOrder, useUpdateOrder, useToggleOrderProductReady } from "@/services/useOrderService";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

export const useOrderPreviewModal = (orderId: number) => {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();
    const pendingRef = useRef(new Set<number>());
    const [pendingProductIds, setPendingProductIds] = useState<Set<number>>(new Set());

    const { data: order, isLoading } = useShowOrder(isOpen ? orderId : 0);
    const { mutate: updateOrder, isPending: isUpdatingStatus } = useUpdateOrder(orderId);
    const { mutateAsync: toggleReady } = useToggleOrderProductReady(orderId);

    const products = order?.order_products ?? [];
    const isServed = order?.estatus_pedido_id === OrderStatusEnum.Served;

    const readyCount = products.filter((p) => p.is_ready).length;
    const totalCount = products.length;
    const allReady   = totalCount > 0 && readyCount === totalCount;

    const invalidateOrder = () => {
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Orders}/${orderId}`] });
        queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Orders] });
    };

    const markServed = () => {
        updateOrder(
            { estatus_pedido_id: OrderStatusEnum.Served },
            {
                onSuccess: () => {
                    invalidateOrder();
                    toast.success("Orden servida");
                    setIsOpen(false);
                },
                onError: () => {
                    toast.error("Error al actualizar el estado");
                },
            }
        );
    };

    const toggleProductReady = async (orderProductId: number) => {
        if (pendingRef.current.has(orderProductId)) return;

        const item        = products.find((p) => p.id === orderProductId);
        const willBeReady = !item?.is_ready;

        pendingRef.current.add(orderProductId);
        setPendingProductIds(new Set(pendingRef.current));

        try {
            await toggleReady(orderProductId, { onSuccess: invalidateOrder });

            // Auto-trigger Served when the last pending item gets marked ready
            if (willBeReady && !isServed) {
                const allWillBeReady = products.every((p) =>
                    p.id === orderProductId ? true : p.is_ready,
                );
                if (allWillBeReady) markServed();
            }
        } catch {
            toast.error("Error al actualizar el platillo");
        } finally {
            pendingRef.current.delete(orderProductId);
            setPendingProductIds(new Set(pendingRef.current));
        }
    };

    return {
        isOpen,
        open:  () => setIsOpen(true),
        close: () => setIsOpen(false),
        products,
        isLoading,
        isServed,
        isUpdatingStatus,
        pendingProductIds,
        readyCount,
        totalCount,
        allReady,
        markServed,
        toggleProductReady,
    };
};
