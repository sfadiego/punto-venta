import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useMatch } from "react-router-dom";
import { useAxios } from "@/hooks/useAxios";
import { Sidebar } from "./Sidebar/Sidebar";
import { Navbar } from "./Navbar/Navbar";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { PrintAgentProvider } from "@/contexts/PrintAgentContext";
import { useGetActiveSale } from "@/services/useOpenSalesService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { getRoleLabel } from "@/components/Role/RoleBadge";

interface AppLayoutProps {
    children?: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout, setSistema } = useAxios();
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

    return (
        <PrintAgentProvider>
        <LayoutProvider onToggleSidebar={handleMenuClick}>
            <div className="flex h-screen bg-stone-50 overflow-hidden">
                {sidebarOpen && (
                    <div
                        className={`fixed inset-0 bg-black/50 z-20 ${desktopSidebarHidden ? "" : "lg:hidden"}`}
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <Sidebar
                    open={sidebarOpen}
                    desktopHidden={desktopSidebarHidden}
                    onClose={() => setSidebarOpen(false)}
                    onLogout={logout}
                    userName={userName}
                    userRole={userRole}
                />

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Navbar solo en móvil (en desktop el toggle está en el header de la página) */}
                    <Navbar onMenuClick={handleMenuClick} />
                    <main className="flex-1 overflow-y-auto">{children ?? <Outlet />}</main>
                </div>
            </div>
        </LayoutProvider>
        </PrintAgentProvider>
    );
}
