import { NavLink } from "react-router-dom";
import {
    PanelLeftOpen,
    LogOut,
    LayoutDashboard,
    Package,
    Tag,
    BarChart2,
    ShoppingBag,
    Coffee,
    Settings,
    Users,
    HandCoins,
    LucideIcon,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAxios } from "@/hooks/useAxios";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { ApisEnum } from "@/configs/apisEnum";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { BusinessLogo } from "@/components/BusinessLogo/BusinessLogo";

type Action = Parameters<ReturnType<typeof usePermissions>["can"]>[0];

interface NavItem {
    label: string;
    icon: LucideIcon;
    path: string;
    permission: Action;
}

const navItems: NavItem[] = [
    { label: "Dashboard",    icon: LayoutDashboard, path: "/",           permission: "viewDashboard" },
    { label: "Órdenes",      icon: Package,         path: "/orders",     permission: "viewOrders" },
    { label: "Productos",    icon: Coffee,          path: "/products",   permission: "viewProducts" },
    { label: "Categorías",   icon: Tag,             path: "/categories", permission: "viewCategories" },
    { label: "Ventas",       icon: ShoppingBag,     path: "/sales",      permission: "viewSales" },
    { label: "Estadísticas", icon: BarChart2,       path: "/statistics", permission: "viewStatistics" },
];

interface SidebarMiniProps {
    userName: string;
    /** On desktop: true when full sidebar is collapsed (mini replaces it). False when full sidebar is expanded (mini is mobile-only). */
    desktopVisible?: boolean;
    onExpand: () => void;
    onLogout: () => void;
}

export function SidebarMini({ userName, desktopVisible = false, onExpand, onLogout }: SidebarMiniProps) {
    const { features } = useAxios();
    const { data: config } = useGetBusinessConfig();
    const { can: canAction } = usePermissions();
    const sellByWeight = features?.sell_by_weight === true;

    const logoUrl = config?.logo_path
        ? `${ApisEnum.BaseUrl}${ApiRoutes.Files}/${config.logo_path}`
        : null;

    const initials = userName
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <aside
            className={`${desktopVisible ? "flex" : "flex lg:hidden"} flex-col flex-shrink-0 w-[60px] overflow-x-hidden`}
            style={{ backgroundColor: "var(--color-sidebar)" }}
        >
            {/* Brand + expand button */}
            <div className="flex flex-col items-center gap-3 px-2 py-4 border-b border-white/10">
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: "var(--color-primary)" }}
                >
                    <BusinessLogo
                        logoUrl={logoUrl}
                        logoIcon={config?.logo_icon ?? null}
                        size={18}
                    />
                </div>

                <MiniTooltipItem label="Expandir menú" side="right">
                    <button
                        onClick={onExpand}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 opacity-50 hover:opacity-100"
                        style={{ color: "var(--color-font)" }}
                        aria-label="Expandir menú"
                    >
                        <PanelLeftOpen size={16} />
                    </button>
                </MiniTooltipItem>
            </div>

            {/* Nav icons */}
            <nav className="flex-1 flex flex-col items-center gap-1 py-4 px-2 overflow-y-auto overflow-x-hidden">
                {navItems
                    .filter((item) => canAction(item.permission))
                    .map((item) => {
                        const label =
                            item.path === "/orders" && sellByWeight ? "Pedidos" : item.label;
                        return (
                            <MiniTooltipItem key={item.path} label={label} side="right">
                                <NavLink
                                    to={item.path}
                                    end={item.path === "/"}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                                    style={({ isActive }) =>
                                        isActive
                                            ? {
                                                  backgroundColor: "var(--color-primary)",
                                                  color: "var(--color-font)",
                                              }
                                            : {
                                                  color: "color-mix(in srgb, var(--color-font) 60%, transparent)",
                                              }
                                    }
                                    aria-label={label}
                                >
                                    <item.icon size={18} />
                                </NavLink>
                            </MiniTooltipItem>
                        );
                    })}

                {(canAction("viewCustomers") || canAction("viewUsers") || canAction("viewAdmin")) && (
                    <div className="mt-auto pt-3 w-full flex flex-col items-center gap-1 border-t border-white/10">
                        {canAction("viewCustomers") && (
                            <MiniTooltipItem label="Clientes" side="right">
                                <NavLink
                                    to="/customers"
                                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                                    style={({ isActive }) =>
                                        isActive
                                            ? {
                                                  backgroundColor: "var(--color-primary)",
                                                  color: "var(--color-font)",
                                              }
                                            : {
                                                  color: "color-mix(in srgb, var(--color-font) 60%, transparent)",
                                              }
                                    }
                                    aria-label="Clientes"
                                >
                                    <HandCoins size={18} />
                                </NavLink>
                            </MiniTooltipItem>
                        )}
                        {canAction("viewUsers") && (
                            <MiniTooltipItem label="Usuarios" side="right">
                                <NavLink
                                    to="/users"
                                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                                    style={({ isActive }) =>
                                        isActive
                                            ? {
                                                  backgroundColor: "var(--color-primary)",
                                                  color: "var(--color-font)",
                                              }
                                            : {
                                                  color: "color-mix(in srgb, var(--color-font) 60%, transparent)",
                                              }
                                    }
                                    aria-label="Usuarios"
                                >
                                    <Users size={18} />
                                </NavLink>
                            </MiniTooltipItem>
                        )}
                        {canAction("viewAdmin") && (
                            <MiniTooltipItem label="Configuración" side="right">
                                <NavLink
                                    to="/admin"
                                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                                    style={({ isActive }) =>
                                        isActive
                                            ? {
                                                  backgroundColor: "var(--color-primary)",
                                                  color: "var(--color-font)",
                                              }
                                            : {
                                                  color: "color-mix(in srgb, var(--color-font) 60%, transparent)",
                                              }
                                    }
                                    aria-label="Configuración"
                                >
                                    <Settings size={18} />
                                </NavLink>
                            </MiniTooltipItem>
                        )}
                    </div>
                )}
            </nav>

            {/* User */}
            <div className="flex flex-col items-center gap-2 px-2 py-4 border-t border-white/10">
                <MiniTooltipItem label={userName} side="right">
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-default flex-shrink-0"
                        style={{ backgroundColor: "var(--color-primary)" }}
                    >
                        {initials}
                    </div>
                </MiniTooltipItem>

                <MiniTooltipItem label="Cerrar sesión" side="right">
                    <button
                        onClick={onLogout}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 opacity-50 hover:opacity-100"
                        style={{ color: "var(--color-font)" }}
                        aria-label="Cerrar sesión"
                    >
                        <LogOut size={16} />
                    </button>
                </MiniTooltipItem>
            </div>
        </aside>
    );
}

interface MiniTooltipItemProps {
    label: string;
    side?: "right" | "left";
    children: React.ReactNode;
}

function MiniTooltipItem({ label, children }: MiniTooltipItemProps) {
    return (
        <div className="relative group w-9">
            {children}
            <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{
                    backgroundColor: "var(--color-sidebar)",
                    color: "var(--color-font)",
                    border: "1px solid color-mix(in srgb, var(--color-font) 15%, transparent)",
                }}
            >
                {label}
            </span>
        </div>
    );
}
