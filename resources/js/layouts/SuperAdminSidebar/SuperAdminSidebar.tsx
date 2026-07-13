import { Building2, LogOut, X } from "lucide-react";
import { superAdminAuth } from "@/contexts/SuperAdminContext";
import { SuperAdminSidebarNav } from "./SuperAdminSidebarNav";

interface SuperAdminSidebarProps {
    open: boolean;
    onClose: () => void;
}

export const SuperAdminSidebar = ({ open, onClose }: SuperAdminSidebarProps) => (
    <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 bg-slate-900 flex flex-col
            transform transition-transform duration-300 ease-in-out
            ${open ? "translate-x-0" : "-translate-x-full"}
            lg:relative lg:translate-x-0`}
    >
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

        <SuperAdminSidebarNav onItemClick={onClose} />

        <div className="px-3 pb-4 flex-shrink-0">
            <button
                onClick={superAdminAuth.logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
                <LogOut size={16} />
                Cerrar sesión
            </button>
        </div>
    </aside>
);
