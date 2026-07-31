import { AppThemeEnum } from "./AppThemeEnum";

export interface AuthThemeStyle {
    gradient: string;
    subtitleText: string;
    featureDescText: string;
    accentBg: string;
    accentBgHover: string;
    focusRing: string;
}

export const AUTH_THEME_STYLES: Record<AppThemeEnum, AuthThemeStyle> = {
    [AppThemeEnum.AmberOrange]: {
        gradient: "bg-gradient-to-br from-amber-600 via-amber-500 to-orange-500",
        subtitleText: "text-amber-100",
        featureDescText: "text-amber-200",
        accentBg: "bg-amber-500",
        accentBgHover: "hover:bg-amber-600",
        focusRing: "focus:ring-amber-400",
    },
    [AppThemeEnum.AzulMarino]: {
        gradient: "bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500",
        subtitleText: "text-blue-100",
        featureDescText: "text-blue-200",
        accentBg: "bg-blue-600",
        accentBgHover: "hover:bg-blue-700",
        focusRing: "focus:ring-blue-400",
    },
    // Alineado con el preset "Turquesa" de businessThemePresets.ts:
    // primary #008991, sidebar #003F44.
    [AppThemeEnum.Turquesa]: {
        gradient: "bg-gradient-to-br from-[#003F44] via-[#008991] to-[#00A4AE]",
        subtitleText: "text-cyan-100",
        featureDescText: "text-cyan-200",
        accentBg: "bg-[#008991]",
        accentBgHover: "hover:bg-[#003F44]",
        focusRing: "focus:ring-[#00A4AE]",
    },
};
