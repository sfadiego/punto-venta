import { Building2, Menu } from "lucide-react";

interface SuperAdminMobileHeaderProps {
    onMenuOpen: () => void;
}

export const SuperAdminMobileHeader = ({ onMenuOpen }: SuperAdminMobileHeaderProps) => (
    <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
            onClick={onMenuOpen}
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
);
