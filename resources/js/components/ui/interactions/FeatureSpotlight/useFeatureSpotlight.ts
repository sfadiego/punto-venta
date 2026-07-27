import { useEffect, useState } from "react";
import { FeatureSpotlightKey } from "@/enums/FeatureSpotlightEnum";
import { useFeatureSpotlightQueue } from "@/contexts/FeatureSpotlightQueueContext";
import {
    useIndexSeenFeatureSpotlights,
    useMarkFeatureSpotlightSeen,
} from "@/services/useFeatureSpotlightService";

export const useFeatureSpotlight = (featureKey: FeatureSpotlightKey) => {
    const { data: seenKeys, isLoading } = useIndexSeenFeatureSpotlights();
    const { mutate: markSeen } = useMarkFeatureSpotlightSeen();
    const { activeKey, register, unregister } = useFeatureSpotlightQueue();
    const [dismissed, setDismissed] = useState(false);

    // Mientras carga, se asume visto para evitar el flash de aparecer y desaparecer.
    const alreadySeen = isLoading || (seenKeys?.includes(featureKey) ?? true);
    const pending = !alreadySeen && !dismissed;

    // Se anota en la cola global mientras esté pendiente por ver, así solo se muestra
    // un spotlight a la vez en toda la app (evita que dos se sobrepongan visualmente).
    useEffect(() => {
        if (!pending) return;
        register(featureKey);
        return () => unregister(featureKey);
    }, [pending, featureKey, register, unregister]);

    const visible = pending && activeKey === featureKey;

    const dismiss = () => {
        setDismissed(true);
        unregister(featureKey);
        markSeen(featureKey);
    };

    return { visible, dismiss };
};
