import { LayoutDashboard, CreditCard, Settings2, AlertTriangle } from "lucide-react";
import { NavLink } from "react-router-dom";
import { SuperAdminRoutes } from "@/enums/RoutesEnum";

const NAV_ITEMS = [
    { to: SuperAdminRoutes.Tenants,       label: "Clientes",        icon: <LayoutDashboard size={16} /> },
    { to: SuperAdminRoutes.Subscriptions, label: "Suscripciones",   icon: <CreditCard size={16} /> },
    { to: SuperAdminRoutes.ErrorLogs,     label: "Logs de errores", icon: <AlertTriangle size={16} /> },
    { to: SuperAdminRoutes.Settings,      label: "Configuración",   icon: <Settings2 size={16} /> },
];

interface SuperAdminSidebarNavProps {
    onItemClick: () => void;
}

export const SuperAdminSidebarNav = ({ onItemClick }: SuperAdminSidebarNavProps) => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
            <NavLink
                key={item.to}
                to={item.to}
                onClick={onItemClick}
                className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`
                }
            >
                {item.icon}
                {item.label}
            </NavLink>
        ))}
    </nav>
);
