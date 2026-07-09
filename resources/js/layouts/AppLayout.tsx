import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useMatch } from "react-router-dom";
import { useAxios } from "@/hooks/useAxios";
import { Sidebar } from "./Sidebar/Sidebar";
import { SidebarMini } from "./Sidebar/SidebarMini";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { PrintAgentProvider } from "@/contexts/PrintAgentContext";
import { useGetActiveSale } from "@/services/useOpenSalesService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { getRoleLabel } from "@/components/Role/RoleBadge";
import { useOrdersSocket } from "@/hooks/useOrdersSocket";

interface AppLayoutProps {
    children?: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);
    const { user, logout, setSistema } = useAxios();
    useOrdersSocket({ showToast: true });
    const { data: activeSale } = useGetActiveSale();
    const { data: config } = useGetBusinessConfig();

    const isTakeOrderRoute = !!useMatch(AdminRoutes.TakeOrder);
    const [desktopSidebarHidden, setDesktopSidebarHidden] = useState(isTakeOrderRoute);

    useEffect(() => {
        setDesktopSidebarHidden(isTakeOrderRoute);
        setSidebarOpen(false);
    }, [isTakeOrderRoute]);

    useEffect(() => {
        setSistema(activeSale?.id ?? null);
    }, [activeSale]);

    useEffect(() => {
        if (!config) return;
        const root = document.documentElement;
        root.style.setProperty("--color-primary", config.primary_color);
        root.style.setProperty("--color-sidebar", config.sidebar_color);
        root.style.setProperty("--color-font", config.font_color);
        root.style.setProperty("--color-label", config.label_color);
    }, [config]);

    const userName = user ? `${user.nombre} ${user.apellido_paterno}` : "Usuario";
    const userRole = user ? getRoleLabel(user.rol_id) : "";

    const handleMenuClick = () => setSidebarOpen((prev) => !prev);
    const handleDesktopToggle = () => setDesktopCollapsed((prev) => !prev);

    // Desktop sidebar is hidden either because we're on TakeOrder route or user collapsed it
    const sidebarDesktopHidden = desktopSidebarHidden || desktopCollapsed;

    // Mini rail: visible on all screen sizes unless on TakeOrder route.
    // On desktop it's hidden when the full sidebar is expanded (CSS lg:hidden via prop).
    // On mobile it's always visible as the primary nav.
    const handleMiniExpand = desktopCollapsed ? handleDesktopToggle : handleMenuClick;

    return (
        <PrintAgentProvider enabled={import.meta.env.VITE_APP_ENV === "local" || !!config?.printer_enabled}>
        <LayoutProvider onToggleSidebar={handleMenuClick}>
            <div className="flex h-dvh bg-stone-50 overflow-hidden">
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Icon rail — always visible except on TakeOrder route */}
                {!desktopSidebarHidden && (
                    <SidebarMini
                        userName={userName}
                        desktopVisible={desktopCollapsed}
                        onExpand={handleMiniExpand}
                        onLogout={logout}
                    />
                )}

                <Sidebar
                    open={sidebarOpen}
                    desktopHidden={sidebarDesktopHidden}
                    onClose={() => setSidebarOpen(false)}
                    onLogout={logout}
                    userName={userName}
                    userRole={userRole}
                    onDesktopToggle={handleDesktopToggle}
                />

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <main className="flex-1 overflow-y-auto">{children ?? <Outlet />}</main>
                </div>
            </div>
        </LayoutProvider>
        </PrintAgentProvider>
    );
}
