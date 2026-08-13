import { useEffect, useRef, useState } from "react";

// El ticket se abre solo al agregar el primer producto y se cierra solo al vaciarse; el
// usuario puede seguir colapsándolo manualmente mientras haya artículos.
export const useTicketDrawer = (cartLength: number) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);
    const prevCartLengthRef = useRef(0);

    useEffect(() => {
        if (cartLength === 0) {
            setIsDrawerOpen(false);
        } else if (prevCartLengthRef.current === 0) {
            setIsDrawerOpen(true);
        }
        prevCartLengthRef.current = cartLength;
    }, [cartLength]);

    return { isDrawerOpen, toggleDrawer };
};
