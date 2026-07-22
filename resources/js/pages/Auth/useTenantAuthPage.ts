import { useEffect, useLayoutEffect } from "react";
import { isAxiosError } from "@/utils/axiosError";
import { useGetTenantBranding } from "@/services/useTenantService";
import { ApiErrorCodeEnum } from "@/enums/ApiErrorCodeEnum";

interface CachedColors {
    primary_color: string;
    sidebar_color: string;
    font_color: string;
    label_color: string;
}

const colorsCacheKey = (slug: string) => `tenant-colors:${slug}`;

const applyColors = (colors: CachedColors) => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", colors.primary_color);
    root.style.setProperty("--color-sidebar", colors.sidebar_color);
    root.style.setProperty("--color-font", colors.font_color);
    root.style.setProperty("--color-label", colors.label_color);
};

const readCachedColors = (slug: string): CachedColors | null => {
    try {
        const raw = localStorage.getItem(colorsCacheKey(slug));
        return raw ? (JSON.parse(raw) as CachedColors) : null;
    } catch {
        return null;
    }
};

export const useTenantAuthPage = (slug: string) => {
    const { data: tenant, isLoading, isError, error } = useGetTenantBranding(slug);

    const isInactive =
        isError &&
        isAxiosError(error) &&
        error.response?.status === 403 &&
        error.response?.data?.code === ApiErrorCodeEnum.TenantInactive;

    const hasCachedColors = !!readCachedColors(slug);

    // Aplica colores cacheados antes del primer paint (sin flash)
    useLayoutEffect(() => {
        if (!slug) return;
        const cached = readCachedColors(slug);
        if (cached) applyColors(cached);
    }, [slug]);

    // Cuando llegan datos frescos: persiste slug, aplica colores y actualiza caché.
    // Solo se ejecuta con tenant válido — evita guardar un slug inexistente en localStorage
    // que causaría un loop de redirección en /auth.
    useEffect(() => {
        if (!tenant) return;
        localStorage.setItem("tenantSlug", slug);
        const colors: CachedColors = {
            primary_color: tenant.primary_color,
            sidebar_color: tenant.sidebar_color,
            font_color:    tenant.font_color,
            label_color:   tenant.label_color,
        };
        applyColors(colors);
        localStorage.setItem(colorsCacheKey(slug), JSON.stringify(colors));
    }, [tenant, slug]);

    // Loading solo si no hay caché (primera visita)
    const showLoading = isLoading && !hasCachedColors;

    return { tenant, isLoading: showLoading, isError, isInactive };
};
