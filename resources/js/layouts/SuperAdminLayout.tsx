import { useState } from "react";
import { Building2, LogOut, LayoutDashboard, CreditCard, Settings2, Menu, X, AlertTriangle } from "lucide-react";
import { NavLink } from "react-router-dom";
import { superAdminAuth } from "@/contexts/SuperAdminContext";
import { SuperAdminRoutes } from "@/enums/RoutesEnum";

const NAV_ITEMS = [
    { to: SuperAdminRoutes.Tenants,       label: "Clientes",       icon: <LayoutDashboard size={16} /> },
    { to: SuperAdminRoutes.Subscriptions, label: "Suscripciones",  icon: <CreditCard size={16} /> },
    { to: SuperAdminRoutes.ErrorLogs,     label: "Logs de errores", icon: <AlertTriangle size={16} /> },
    { to: SuperAdminRoutes.Settings,      label: "Configuración",  icon: <Settings2 size={16} /> },
];

interface SidebarContentProps {
    onClose: () => void;
}

const SidebarContent = ({ onClose }: SidebarContentProps) => (
    <>
        <div className="px-5 py-5 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
                    <Building2 size={16} className="text-white" />
                </div>
                <div className="min-w-0">
                    <p className="text-white text-sm font-bold leading-tight">Super Admin</p>
                    <p className="text-slate-400 text-xs truncate">{import.meta.env.VITE_APP_NAME}</p>
                </div>
            </div>
            <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Cerrar menú"
            >
                <X size={18} />
            </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
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

        <div className="px-3 pb-4 flex-shrink-0">
            <button
                onClick={superAdminAuth.logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
                <LogOut size={16} />
                Cerrar sesión
            </button>
        </div>
    </>
);

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Overlay móvil */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-60 bg-slate-900 flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    lg:relative lg:translate-x-0`}
            >
                <SidebarContent onClose={() => setSidebarOpen(false)} />
            </aside>

            {/* Contenido */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Navbar móvil */}
                <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                        aria-label="Abrir menú"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center">
                            <Building2 size={12} className="text-white" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">Super Admin</span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
