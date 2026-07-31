import { useState } from "react";

export const useSuperAdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);

    const handleMiniExpand = desktopCollapsed
        ? () => setDesktopCollapsed((prev) => !prev)
        : () => setSidebarOpen((prev) => !prev);

    return {
        sidebarOpen,
        openSidebar: () => setSidebarOpen(true),
        closeSidebar: () => setSidebarOpen(false),
        desktopCollapsed,
        handleDesktopToggle: () => setDesktopCollapsed((prev) => !prev),
        handleMiniExpand,
    };
};
