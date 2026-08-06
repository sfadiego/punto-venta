import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { buildCartItems, calcCartTotals } from "@/utils/cartCalc";
import { ICartItem } from "@/models/ICartItem";
import { useShowOrder } from "@/services/useOrderService";
import { getEcho } from "@/hooks/useOrdersSocket";

const EDITABLE_STATUSES = [OrderStatusEnum.InProcess, OrderStatusEnum.Served];
const SYNC_EVENT_TYPES = ["product_updated", "served", "restored_served", "updated"];

export const useTakeOrderData = () => {
    const { id } = useParams<{ id: string }>();
    const orderId = Number(id);
    const queryClient = useQueryClient();
    // El backend ya filtra por tenant_id vía TenantScope + route model binding
    // (ResolveTenant corre antes de SubstituteBindings), así que un id de otro
    // tenant o inexistente resulta en 404 (isError). Aquí solo detectamos ids
    // sintácticamente inválidos (no numéricos, negativos, etc.) para evitar
    // disparar el fetch con un valor absurdo.
    const isInvalidId = !id || !Number.isInteger(orderId) || orderId <= 0;

    const { data: order, isLoading: loadingOrder, isError: orderFetchError } =
        useShowOrder(isInvalidId ? 0 : orderId);
    const isError = isInvalidId || orderFetchError;

    // useOrdersSocket (global, en AppLayout) solo refetchea listados — su queryKey
    // no matchea el detalle de una orden individual ("/api/order/{id}"). Sin este
    // listener propio, si otro usuario agrega/quita productos de esta misma orden
    // mientras la tenemos abierta aquí, nunca nos enteramos hasta recargar.
    useEffect(() => {
        if (isInvalidId) return;

        const channel = getEcho().channel("orders");

        const handler = (data: { type?: string; order_id?: number }) => {
            if (data.order_id !== orderId) return;
            if (data.type && SYNC_EVENT_TYPES.includes(data.type)) {
                queryClient.invalidateQueries({
                    queryKey: [`${ApiRoutes.Orders}/${orderId}`],
                });
            }
        };

        channel.listen(".orders.updated", handler);

        return () => {
            channel.stopListening(".orders.updated", handler);
        };
    }, [isInvalidId, orderId, queryClient]);

    const isReadOnly =
        !order || !EDITABLE_STATUSES.includes(order.estatus_pedido_id);

    const cart: ICartItem[] = buildCartItems(order?.order_products);
    const orderDiscount = order?.descuento ?? 0;
    const { cartCount, subtotal, total } = calcCartTotals(cart, orderDiscount);

    return {
        orderId,
        order,
        loadingOrder,
        isError,
        isReadOnly,
        cart,
        cartCount,
        subtotal,
        orderDiscount,
        total,
    };
};
