import { useRef, useState } from "react";

// Cuánto dura el resaltado del renglón recién agregado en el ticket (feedback visual breve).
const LAST_ADDED_FLASH_MS = 600;

export const useLastAddedFlash = () => {
    const [lastAddedOrderProductId, setLastAddedOrderProductId] = useState<number | null>(null);
    const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Mismo patrón de useQuickSaleScale (ref-tracked timeout): limpia cualquier flash pendiente
    // antes de programar el siguiente, para que toques rápidos no corten el resaltado a medias.
    const flashLastAdded = (orderProductId: number) => {
        if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
        setLastAddedOrderProductId(orderProductId);
        flashTimeoutRef.current = setTimeout(() => setLastAddedOrderProductId(null), LAST_ADDED_FLASH_MS);
    };

    return { lastAddedOrderProductId, flashLastAdded };
};
