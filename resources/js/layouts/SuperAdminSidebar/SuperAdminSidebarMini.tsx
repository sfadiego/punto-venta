import { NavLink } from "react-router-dom";
import { Building2, LogOut, PanelLeftOpen } from "lucide-react";
import { superAdminAuth } from "@/contexts/SuperAdminContext";
import { NAV_ITEMS } from "./SuperAdminSidebarNav";

interface SuperAdminSidebarMiniProps {
    /** On desktop: true when full sidebar is collapsed (mini replaces it). False when full sidebar is expanded (mini is mobile-only). */
    desktopVisible?: boolean;
    onExpand: () => void;
}

export const SuperAdminSidebarMini = ({ desktopVisible = false, onExpand }: SuperAdminSidebarMiniProps) => (
    <aside className={`${desktopVisible ? "flex" : "flex lg:hidden"} flex-col flex-shrink-0 w-[60px] bg-slate-900 overflow-x-hidden`}>
        <div className="flex flex-col items-center gap-3 px-2 py-4 border-b border-white/10">
            <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
                <Building2 size={16} className="text-white" />
            </div>

            <MiniTooltipItem label="Expandir menú">
                <button
                    onClick={onExpand}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    aria-label="Expandir menú"
                >
                    <PanelLeftOpen size={16} />
                </button>
            </MiniTooltipItem>
        </div>

        <nav className="flex-1 flex flex-col items-center gap-1 py-4 px-2 overflow-y-auto overflow-x-hidden">
            {NAV_ITEMS.map((item) => (
                <MiniTooltipItem key={item.to} label={item.label}>
                    <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                            `w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                isActive
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                            }`
                        }
                        aria-label={item.label}
                    >
                        {item.icon}
                    </NavLink>
                </MiniTooltipItem>
            ))}
        </nav>

        <div className="px-2 pb-4 flex-shrink-0 flex justify-center">
            <MiniTooltipItem label="Cerrar sesión">
                <button
                    onClick={superAdminAuth.logout}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    aria-label="Cerrar sesión"
                >
                    <LogOut size={16} />
                </button>
            </MiniTooltipItem>
        </div>
    </aside>
);

interface MiniTooltipItemProps {
    label: string;
    children: React.ReactNode;
}

function MiniTooltipItem({ label, children }: MiniTooltipItemProps) {
    return (
        <div className="relative group w-9">
            {children}
            <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-800 text-white border border-white/10">
                {label}
            </span>
        </div>
    );
}
