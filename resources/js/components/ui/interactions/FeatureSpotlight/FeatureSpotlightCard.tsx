import { Ref } from "react";
import { X } from "lucide-react";
import { ARROW_PLACEMENT_CLASSES, Coords, Placement, POPOVER_WIDTH } from "./types";

interface FeatureSpotlightCardProps {
    cardRef: Ref<HTMLDivElement>;
    coords: Coords;
    placement: Placement;
    title: string;
    description: string;
    onDismiss: () => void;
}

export const FeatureSpotlightCard = ({
    cardRef,
    coords,
    placement,
    title,
    description,
    onDismiss,
}: FeatureSpotlightCardProps) => (
    <div
        ref={cardRef}
        style={{ top: coords.top, left: coords.left, transform: coords.transform, width: POPOVER_WIDTH }}
        className="fixed z-50 rounded-xl bg-stone-800 p-4 text-white shadow-xl"
    >
        <div className={`absolute h-3 w-3 rotate-45 bg-stone-800 ${ARROW_PLACEMENT_CLASSES[placement]}`} />

        <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold">{title}</p>
            <button
                type="button"
                onClick={onDismiss}
                className="shrink-0 text-stone-400 hover:text-white transition-colors"
            >
                <X size={16} />
            </button>
        </div>

        <p className="mt-1 text-xs text-stone-300">{description}</p>

        <button
            type="button"
            onClick={onDismiss}
            className="mt-3 rounded-lg bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors"
        >
            Entendido
        </button>
    </div>
);
