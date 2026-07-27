import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FeatureSpotlightKey } from "@/enums/FeatureSpotlightEnum";
import {
    useGetTenantFeatureSpotlights,
    useUpdateTenantFeatureSpotlights,
} from "@/services/useTenantFeatureSpotlightService";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

export const useTenantFeatureSpotlightsSection = (tenantId: number) => {
    const { data: checklist, isLoading } = useGetTenantFeatureSpotlights(tenantId);
    const { mutate: save, isPending: saving } = useUpdateTenantFeatureSpotlights(tenantId);
    const [enabledKeys, setEnabledKeys] = useState<Set<FeatureSpotlightKey>>(new Set());

    useEffect(() => {
        if (!checklist) return;
        setEnabledKeys(new Set(checklist.filter((item) => item.enabled).map((item) => item.key)));
    }, [checklist]);

    const toggle = (key: FeatureSpotlightKey) => {
        setEnabledKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const allKeys = Object.values(FeatureSpotlightKey);
    const allChecked = enabledKeys.size === allKeys.length;

    const toggleAll = () => {
        setEnabledKeys(allChecked ? new Set() : new Set(allKeys));
    };

    const handleSave = () => {
        save(Array.from(enabledKeys), {
            onSuccess: () => toast.success("Preferencias de novedades actualizadas"),
            onError: (error) => toast.error(getUserFacingErrorMessage(error, "Error al guardar")),
        });
    };

    return { enabledKeys, toggle, allChecked, toggleAll, handleSave, saving, isLoading };
};
