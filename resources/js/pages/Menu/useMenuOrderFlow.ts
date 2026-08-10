import { useState, useCallback } from "react";
import { useCart } from "./useCart";

export const useMenuOrderFlow = (cart: ReturnType<typeof useCart>) => {
    const [cartOpen, setCartOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [orderConfirmed, setOrderConfirmed] = useState(false);

    const handleOrderSuccess = useCallback(() => {
        cart.clear();
        setOrderConfirmed(true);
    }, [cart]);

    const startNewOrder = useCallback(() => {
        setOrderConfirmed(false);
    }, []);

    return {
        cartOpen,
        setCartOpen,
        checkoutOpen,
        setCheckoutOpen,
        orderConfirmed,
        handleOrderSuccess,
        startNewOrder,
    };
};
