import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { useShowOrder, useUpdateOrder, useToggleOrderProductReady } from "@/services/useOrderService";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { getEcho } from "@/hooks/useOrdersSocket";

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
    const isEmpty    = products.length === 0 || (order?.total ?? 0) === 0;

    const invalidateOrder = () => {
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Orders}/${orderId}`] });
        queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Orders] });
    };

    useEffect(() => {
        if (!isOpen) return;

        const channel = getEcho().channel("orders");

        const handler = (data: { type?: string; order_id?: number }) => {
            if (data.order_id !== orderId) return;
            if (
                data.type === "product_updated" ||
                data.type === "served" ||
                data.type === "restored_served" ||
                data.type === "updated"
            ) {
                queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Orders}/${orderId}`] });
            }
        };

        channel.listen(".orders.updated", handler);

        return () => {
            channel.stopListening(".orders.updated", handler);
        };
    }, [isOpen, orderId, queryClient]);

    const markServed = () => {
        updateOrder(
            { estatus_pedido_id: OrderStatusEnum.Served },
            {
                onSuccess: () => {
                    invalidateOrder();
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
        } catch (error) {
            logUnexpectedError(error, "useOrderPreviewModal.toggleProductReady");
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
        isEmpty,
        readyCount,
        totalCount,
        allReady,
        markServed,
        toggleProductReady,
    };
};
