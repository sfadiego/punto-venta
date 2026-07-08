import { X, PanelLeftClose } from "lucide-react";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { ApisEnum } from "@/configs/apisEnum";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { BusinessLogo } from "@/components/BusinessLogo/BusinessLogo";

interface SidebarBrandProps {
    onClose: () => void;
    onDesktopToggle?: () => void;
}

export function SidebarBrand({ onClose, onDesktopToggle }: SidebarBrandProps) {
    const { data: config } = useGetBusinessConfig();
    const appName = config?.business_name ?? import.meta.env.VITE_APP_NAME;
    const logoUrl = config?.logo_path
        ? `${ApisEnum.BaseUrl}${ApiRoutes.Files}/${config.logo_path}`
        : null;

    return (
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: "var(--color-primary)" }}
                >
                    <BusinessLogo
                        logoUrl={logoUrl}
                        logoIcon={config?.logo_icon ?? null}
                        size={16}
                    />
                </div>
                <span
                    className="font-bold text-base tracking-tight"
                    style={{ color: "var(--color-font)" }}
                >
                    {appName}
                </span>
            </div>
            {/* Cerrar en móvil */}
            <button
                onClick={onClose}
                className="lg:hidden p-1 rounded transition-colors"
                style={{ color: "color-mix(in srgb, var(--color-font) 50%, transparent)" }}
                aria-label="Cerrar menú"
            >
                <X size={18} />
            </button>

            {/* Colapsar en desktop */}
            {onDesktopToggle && (
                <button
                    onClick={onDesktopToggle}
                    title="Ocultar menú"
                    aria-label="Ocultar menú"
                    className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 opacity-40 hover:opacity-100"
                    style={{ color: "var(--color-font)" }}
                >
                    <PanelLeftClose size={17} />
                </button>
            )}
        </div>
    );
}
