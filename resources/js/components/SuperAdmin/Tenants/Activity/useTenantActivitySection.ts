import { useState } from "react";
import { useGetTenantActivity } from "@/services/useTenantActivityService";

export const ACTIVITY_RANGE_OPTIONS = [7, 30, 90] as const;

export const useTenantActivitySection = (tenantId: number) => {
    const [days, setDays] = useState<number>(30);
    const { data, isLoading } = useGetTenantActivity(tenantId, days);

    return { days, setDays, data, isLoading };
};
