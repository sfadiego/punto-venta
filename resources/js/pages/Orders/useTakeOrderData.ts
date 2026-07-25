import { useParams } from "react-router-dom";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { buildCartItems, calcCartTotals } from "@/utils/cartCalc";
import { ICartItem } from "@/models/ICartItem";
import { useShowOrder } from "@/services/useOrderService";

const EDITABLE_STATUSES = [OrderStatusEnum.InProcess, OrderStatusEnum.Served];

export const useTakeOrderData = () => {
    const { id } = useParams<{ id: string }>();
    const orderId = Number(id);
    // El backend ya filtra por tenant_id vía TenantScope + route model binding
    // (ResolveTenant corre antes de SubstituteBindings), así que un id de otro
    // tenant o inexistente resulta en 404 (isError). Aquí solo detectamos ids
    // sintácticamente inválidos (no numéricos, negativos, etc.) para evitar
    // disparar el fetch con un valor absurdo.
    const isInvalidId = !id || !Number.isInteger(orderId) || orderId <= 0;

    const { data: order, isLoading: loadingOrder, isError: orderFetchError } =
        useShowOrder(isInvalidId ? 0 : orderId);
    const isError = isInvalidId || orderFetchError;

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
