import { useCart } from "./useCart";
import { useMenuCatalog } from "./useMenuCatalog";
import { useMenuOrderFlow } from "./useMenuOrderFlow";

export const useMenuPage = () => {
    const catalog = useMenuCatalog();
    const cart = useCart();
    const orderFlow = useMenuOrderFlow(cart);

    return {
        ...catalog,
        cart,
        ...orderFlow,
    };
};
