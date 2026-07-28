import { useTakeOrderData } from "./useTakeOrderData";
import { useCartActions } from "./useCartActions";
import { useOrderDiscounts } from "./useOrderDiscounts";
import { useOrderDelivery } from "./useOrderDelivery";
import { calcDeliveryTotal } from "@/utils/deliveryCalc";

export const useTakeOrder = () => {
    const data = useTakeOrderData();
    const cartActions = useCartActions(data.orderId, data.cart, data.isReadOnly);
    const discounts = useOrderDiscounts(data.orderId, data.isReadOnly);
    const delivery = useOrderDelivery(data.orderId, data.order, data.isReadOnly);

    const totalFinal = calcDeliveryTotal(
        data.total,
        delivery.domicilio,
        delivery.domicilioActivo,
        delivery.customerPays,
    );

    return {
        ...data,
        loadingCart: data.loadingOrder,
        ...cartActions,
        ...discounts,
        ...delivery,
        totalFinal,
    };
};
