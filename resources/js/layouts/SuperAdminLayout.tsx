import { SuperAdminSidebar } from "./SuperAdminSidebar/SuperAdminSidebar";
import { SuperAdminSidebarMini } from "./SuperAdminSidebar/SuperAdminSidebarMini";
import { SuperAdminMobileHeader } from "./SuperAdminSidebar/SuperAdminMobileHeader";
import { useSuperAdminLayout } from "./useSuperAdminLayout";

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const { sidebarOpen, openSidebar, closeSidebar, desktopCollapsed, handleDesktopToggle, handleMiniExpand } =
        useSuperAdminLayout();

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={closeSidebar}
                />
            )}

            <SuperAdminSidebarMini desktopVisible={desktopCollapsed} onExpand={handleMiniExpand} />

            <SuperAdminSidebar
                open={sidebarOpen}
                desktopHidden={desktopCollapsed}
                onClose={closeSidebar}
                onDesktopToggle={handleDesktopToggle}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <SuperAdminMobileHeader onMenuOpen={openSidebar} />
                <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
