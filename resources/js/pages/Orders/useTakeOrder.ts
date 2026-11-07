import { useTakeOrderData } from "./useTakeOrderData";
import { useCartActions } from "./useCartActions";
import { useOrderDiscounts } from "./useOrderDiscounts";
import { useOrderDelivery } from "./useOrderDelivery";
import { calcDeliveryTotal } from "@/utils/deliveryCalc";
import { calcCartTotals } from "@/utils/cartCalc";
import { useFlushOnLeave } from "@/hooks/useFlushOnLeave";

export const useTakeOrder = () => {
    const data = useTakeOrderData();
    const cartActions = useCartActions(data.orderId, data.serverCart, data.isReadOnly);
    useFlushOnLeave(cartActions.hasPending, cartActions.flushAll);
    const discounts = useOrderDiscounts(data.orderId, data.isReadOnly, cartActions.flushLine);
    const delivery = useOrderDelivery(data.orderId, data.order, data.isReadOnly);

    const { cartCount, subtotal, total } = calcCartTotals(cartActions.cart, data.orderDiscount);

    const totalFinal = calcDeliveryTotal(
        total,
        delivery.domicilio,
        delivery.domicilioActivo,
        delivery.customerPays,
    );

    return {
        ...data,
        loadingCart: data.loadingOrder,
        ...cartActions,
        cartCount,
        subtotal,
        total,
        ...discounts,
        ...delivery,
        totalFinal,
    };
};
