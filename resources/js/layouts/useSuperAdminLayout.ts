import { useState } from "react";

export const useSuperAdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return {
        sidebarOpen,
        openSidebar: () => setSidebarOpen(true),
        closeSidebar: () => setSidebarOpen(false),
    };
};
