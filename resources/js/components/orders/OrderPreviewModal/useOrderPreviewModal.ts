import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import {
    useShowOrder,
    useUpdateOrder,
    useToggleOrderProductReady,
} from "@/services/useOrderService";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { getEcho } from "@/hooks/useOrdersSocket";
import { useOptimisticPendingSet } from "@/hooks/useOptimisticPendingSet";
import { groupOrderProducts } from "@/utils/groupOrderProducts";

export const useOrderPreviewModal = (orderId: number) => {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        new Set(),
    );
    const queryClient = useQueryClient();
    const { pendingIds: pendingProductIds, isPending, withPending } =
        useOptimisticPendingSet<number>();

    const { data: order, isLoading } = useShowOrder(isOpen ? orderId : 0);
    const { mutate: updateOrder, isPending: isUpdatingStatus } =
        useUpdateOrder(orderId);
    const { mutateAsync: toggleReady } = useToggleOrderProductReady(orderId);

    const products = order?.order_products ?? [];
    const isServed = order?.estatus_pedido_id === OrderStatusEnum.Served;

    const readyCount = products.filter((p) => p.is_ready).length;
    const totalCount = products.length;
    const allReady = totalCount > 0 && readyCount === totalCount;
    const isEmpty = products.length === 0 || (order?.total ?? 0) === 0;

    const invalidateOrder = () => {
        queryClient.invalidateQueries({
            queryKey: [`${ApiRoutes.Orders}/${orderId}`],
        });
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
                queryClient.invalidateQueries({
                    queryKey: [`${ApiRoutes.Orders}/${orderId}`],
                });
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
            },
        );
    };

    const toggleProductReady = async (orderProductId: number) => {
        if (isPending(orderProductId)) return;

        const item = products.find((p) => p.id === orderProductId);
        const willBeReady = !item?.is_ready;

        try {
            await withPending([orderProductId], () =>
                toggleReady(orderProductId, { onSuccess: invalidateOrder }),
            );

            // Auto-trigger Served when the last pending item gets marked ready
            if (willBeReady && !isServed) {
                const allWillBeReady = products.every((p) =>
                    p.id === orderProductId ? true : p.is_ready,
                );
                if (allWillBeReady) markServed();
            }
        } catch (error) {
            logUnexpectedError(
                error,
                "useOrderPreviewModal.toggleProductReady",
            );
            toast.error("Error al actualizar el platillo");
        }
    };

    const productGroups = useMemo(
        () => groupOrderProducts(order?.order_products),
        [order?.order_products],
    );

    const toggleGroupExpand = (key: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const toggleGroupReady = async (groupKey: string) => {
        const group = productGroups.find((g) => g.key === groupKey);
        if (!group) return;
        const idsToToggle = group.allReady
            ? group.items.map((i) => i.id!)
            : group.items.filter((i) => !i.is_ready).map((i) => i.id!);
        for (const id of idsToToggle) {
            await toggleProductReady(id);
        }
    };

    return {
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        products,
        productGroups,
        expandedGroups,
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
        toggleGroupExpand,
        toggleGroupReady,
    };
};
