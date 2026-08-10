import { AppThemeEnum } from "./AppThemeEnum";

export interface BusinessThemePreset {
    primary_color: string;
    sidebar_color: string;
    font_color: string;
    label_color: string;
}

// Mismas 3 paletas del selector de tema del login (SuperAdmin > Configuración),
// adaptadas a los 4 campos de color que usa la identidad de negocio del cliente.
export const BUSINESS_THEME_PRESETS: Record<AppThemeEnum, BusinessThemePreset> = {
    [AppThemeEnum.AmberOrange]: {
        primary_color: "#F59E0B",
        sidebar_color: "#1C1917",
        font_color: "#FFFFFF",
        label_color: "#1C1917",
    },
    [AppThemeEnum.AzulMarino]: {
        primary_color: "#3B6EA5",
        sidebar_color: "#1F2A44",
        font_color: "#FFFFFF",
        label_color: "#1F2A44",
    },
    // Colores exactos del landing (public/landing/index.html): --ember-ink #006D74, --ember #008991.
    [AppThemeEnum.Turquesa]: {
        primary_color: "#008991",
        sidebar_color: "#003F44",
        font_color: "#FFFFFF",
        label_color: "#111827",
    },
};
