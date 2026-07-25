import { useTakeOrderData } from "./useTakeOrderData";
import { useCartActions } from "./useCartActions";
import { useOrderDiscounts } from "./useOrderDiscounts";

export const useTakeOrder = () => {
    const data = useTakeOrderData();
    const cartActions = useCartActions(data.orderId, data.cart, data.isReadOnly);
    const discounts = useOrderDiscounts(data.orderId, data.isReadOnly);

    return {
        ...data,
        loadingCart: data.loadingOrder,
        ...cartActions,
        ...discounts,
    };
};
