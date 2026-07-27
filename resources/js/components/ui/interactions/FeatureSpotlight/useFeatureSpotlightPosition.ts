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
            setCoords(calcSpotlightCoords(triggerRef.current.getBoundingClientRect(), placement));
        };

        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
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
