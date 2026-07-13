import { useEffect, useState } from "react";
import { useMatch } from "react-router-dom";
import { useAxios } from "@/hooks/useAxios";
import { useGetActiveSale } from "@/services/useOpenSalesService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { getRoleLabel } from "@/components/Role/RoleBadge";
import { logUnexpectedError } from "@/plugins/logger.plugin";

export const useAppLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);

    const { user, logout, setSistema, axiosApi } = useAxios();
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

    const handleLogout = async () => {
        try {
            await axiosApi.post(ApiRoutes.Logout);
        } catch (error) {
            // Ignorar errores — el logout local siempre procede
            logUnexpectedError(error, "handleLogout.logout");
        } finally {
            logout();
        }
    };

    const userName = user ? `${user.nombre} ${user.apellido_paterno}` : "Usuario";
    const userRole = user ? getRoleLabel(user.rol_id) : "";

    const sidebarDesktopHidden = desktopSidebarHidden || desktopCollapsed;
    const handleMiniExpand = desktopCollapsed
        ? () => setDesktopCollapsed((prev) => !prev)
        : () => setSidebarOpen((prev) => !prev);

    return {
        sidebarOpen,
        setSidebarOpen,
        desktopCollapsed,
        desktopSidebarHidden,
        sidebarDesktopHidden,
        handleMiniExpand,
        handleMenuClick: () => setSidebarOpen((prev) => !prev),
        handleDesktopToggle: () => setDesktopCollapsed((prev) => !prev),
        handleLogout,
        userName,
        userRole,
        config,
    };
};
