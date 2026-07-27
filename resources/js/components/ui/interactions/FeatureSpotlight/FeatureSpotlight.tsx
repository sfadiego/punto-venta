import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { FeatureSpotlightKey } from "@/enums/FeatureSpotlightEnum";
import { useFeatureSpotlight } from "./useFeatureSpotlight";
import { useFeatureSpotlightPosition } from "./useFeatureSpotlightPosition";
import { FeatureSpotlightCard } from "./FeatureSpotlightCard";
import { Placement, Variant, VARIANT_CLASSES } from "./types";

interface FeatureSpotlightProps {
    featureKey: FeatureSpotlightKey;
    title: string;
    description: string;
    placement?: Placement;
    /** "inline" para envolver un botón/elemento puntual, "block" para envolver una sección completa (w-full) sin desacomodar el layout del padre. */
    variant?: Variant;
    children: ReactNode;
}

export const FeatureSpotlight = ({
    featureKey,
    title,
    description,
    placement = "bottom-start",
    variant = "inline",
    children,
}: FeatureSpotlightProps) => {
    const { visible, dismiss } = useFeatureSpotlight(featureKey);
    const { triggerRef, popoverRef, coords } = useFeatureSpotlightPosition(visible, placement);

    return (
        <div ref={triggerRef} className={VARIANT_CLASSES[variant]}>
            {children}

            {visible && coords &&
                createPortal(
                    <FeatureSpotlightCard
                        cardRef={popoverRef}
                        coords={coords}
                        placement={placement}
                        title={title}
                        description={description}
                        onDismiss={dismiss}
                    />,
                    document.body,
                )}
        </div>
    );
};
