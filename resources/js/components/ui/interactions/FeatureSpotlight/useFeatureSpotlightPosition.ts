import { useLayoutEffect, useRef, useState } from "react";
import { calcSpotlightCoords, clampSpotlightCoords } from "@/utils/calcSpotlightCoords";
import { Coords, Placement } from "./types";

export const useFeatureSpotlightPosition = (visible: boolean, placement: Placement) => {
    const triggerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<Coords | null>(null);

    useLayoutEffect(() => {
        if (!visible || !triggerRef.current) {
            setCoords(null);
            return;
        }

        const updatePosition = () => {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();

            // El trigger puede seguir montado pero fuera de pantalla (ej. sidebar
            // colapsado o cerrado en mobile, movido con translate-x fuera del
            // viewport en vez de desmontarse) — en ese caso no hay nada visible a lo
            // que "apuntar", así que no se muestra la tarjeta en vez de flotar
            // desconectada del elemento real.
            const isOffscreen =
                rect.right <= 0 || rect.left >= window.innerWidth ||
                rect.bottom <= 0 || rect.top >= window.innerHeight;
            if (isOffscreen) {
                setCoords(null);
                return;
            }

            setCoords(calcSpotlightCoords(rect, placement));
        };

        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        // El sidebar (y otros triggers) puede animarse con `transition-transform`
        // (ej. colapsar/expandir) sin disparar resize/scroll — se recalcula al
        // terminar esa transición para que la tarjeta reaparezca en su lugar.
        window.addEventListener("transitionend", updatePosition, true);
        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("transitionend", updatePosition, true);
        };
    }, [visible, placement]);

    // Red de seguridad: si con el placement elegido el popover igual se sale del
    // viewport (ej. última sección de la página sin espacio debajo), se recorta
    // dentro de los límites visibles sin alterar el layout del resto de la página.
    useLayoutEffect(() => {
        if (!coords || !popoverRef.current) return;

        const rect = popoverRef.current.getBoundingClientRect();
        const clamped = clampSpotlightCoords(rect);

        if (Math.abs(clamped.top - rect.top) > 1 || Math.abs(clamped.left - rect.left) > 1) {
            setCoords((prev) =>
                prev && {
                    ...prev,
                    top: prev.top + (clamped.top - rect.top),
                    left: prev.left + (clamped.left - rect.left),
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [coords?.top, coords?.left]);

    return { triggerRef, popoverRef, coords };
};
