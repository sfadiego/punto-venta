import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar/Sidebar";
import { SidebarMini } from "./Sidebar/SidebarMini";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { PrintAgentProvider } from "@/contexts/PrintAgentContext";
import { useOrdersSocket } from "@/hooks/useOrdersSocket";
import { useAppLayout } from "./useAppLayout";

interface AppLayoutProps {
    children?: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    useOrdersSocket({ showToast: true });

    const {
        sidebarOpen,
        setSidebarOpen,
        desktopCollapsed,
        desktopSidebarHidden,
        sidebarDesktopHidden,
        handleMiniExpand,
        handleMenuClick,
        handleDesktopToggle,
        handleLogout,
        userName,
        userRole,
        config,
    } = useAppLayout();

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

                {!desktopSidebarHidden && (
                    <SidebarMini
                        userName={userName}
                        desktopVisible={desktopCollapsed}
                        onExpand={handleMiniExpand}
                        onLogout={handleLogout}
                    />
                )}

                <Sidebar
                    open={sidebarOpen}
                    desktopHidden={sidebarDesktopHidden}
                    onClose={() => setSidebarOpen(false)}
                    onLogout={handleLogout}
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
