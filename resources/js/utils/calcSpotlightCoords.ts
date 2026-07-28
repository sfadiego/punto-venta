import { Coords, Placement, POPOVER_WIDTH, VIEWPORT_MARGIN } from "@/components/ui/interactions/FeatureSpotlight/types";

export const calcSpotlightCoords = (trigger: DOMRect, placement: Placement): Coords => {
    switch (placement) {
        case "top-start":
            return {
                top: trigger.top - 12,
                left: Math.min(trigger.left, window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN),
                transform: "translateY(-100%)",
            };
        case "right-start":
            // Usado exclusivamente por el Sidebar (fondo oscuro) — más separación que el
            // resto de placements para que la tarjeta (también oscura) no se confunda
            // visualmente con el borde del sidebar.
            return { top: trigger.top, left: trigger.right + 24 };
        case "left-start":
            return { top: trigger.top, left: trigger.left - POPOVER_WIDTH - 12 };
        case "bottom-start":
        default:
            return {
                top: trigger.bottom + 12,
                left: Math.min(trigger.left, window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN),
            };
    }
};

export const clampSpotlightCoords = (rect: DOMRect): { top: number; left: number } => ({
    top: Math.min(Math.max(rect.top, VIEWPORT_MARGIN), window.innerHeight - rect.height - VIEWPORT_MARGIN),
    left: Math.min(Math.max(rect.left, VIEWPORT_MARGIN), window.innerWidth - rect.width - VIEWPORT_MARGIN),
});
