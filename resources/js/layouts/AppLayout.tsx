import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useMatch } from "react-router-dom";
import { PanelLeftOpen } from "lucide-react";
import { useAxios } from "@/hooks/useAxios";
import { Sidebar } from "./Sidebar/Sidebar";
import { Navbar } from "./Navbar/Navbar";
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

    const sidebarFullyHidden = desktopSidebarHidden || desktopCollapsed;

    return (
        <PrintAgentProvider enabled={import.meta.env.VITE_APP_ENV === "local" || !!config?.printer_enabled}>
        <LayoutProvider onToggleSidebar={handleMenuClick}>
            <div className="flex h-screen bg-stone-50 overflow-hidden">
                {sidebarOpen && (
                    <div
                        className={`fixed inset-0 bg-black/50 z-20 ${sidebarFullyHidden ? "" : "lg:hidden"}`}
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <Sidebar
                    open={sidebarOpen}
                    desktopHidden={sidebarFullyHidden}
                    onClose={() => setSidebarOpen(false)}
                    onLogout={logout}
                    userName={userName}
                    userRole={userRole}
                    onDesktopToggle={handleDesktopToggle}
                />

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    <Navbar onMenuClick={handleMenuClick} />

                    {/* Botón para reabrir sidebar en desktop cuando está colapsado */}
                    {sidebarFullyHidden && !desktopSidebarHidden && (
                        <button
                            onClick={handleDesktopToggle}
                            title="Abrir menú"
                            className="hidden lg:flex absolute top-4 left-4 z-10 items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full shadow-md border border-stone-200 bg-white text-stone-500 hover:text-stone-800 hover:shadow-lg transition-all duration-200 text-xs font-medium"
                        >
                            <PanelLeftOpen size={15} />
                            Menú
                        </button>
                    )}

                    <main className="flex-1 overflow-y-auto">{children ?? <Outlet />}</main>
                </div>
            </div>
        </LayoutProvider>
        </PrintAgentProvider>
    );
}
