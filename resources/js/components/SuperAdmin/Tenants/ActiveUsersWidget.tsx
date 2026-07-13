import { Activity, Users, RefreshCw } from "lucide-react";
import { ITenant } from "@/models/ITenant";

interface ActiveUsersWidgetProps {
    tenants: ITenant[];
    onRefresh: () => void;
    isRefreshing: boolean;
}

export const ActiveUsersWidget = ({ tenants, onRefresh, isRefreshing }: ActiveUsersWidgetProps) => {
    const totalActive = tenants.reduce((sum, t) => sum + (t.active_users_count ?? 0), 0);
    const tenantsWithActivity = tenants.filter((t) => (t.active_users_count ?? 0) > 0).length;

    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm mb-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Activity size={18} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Usuarios activos ahora</p>
                <p className="text-2xl font-bold text-slate-900 leading-tight">{totalActive}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                        <Users size={14} />
                        <span>{tenantsWithActivity} cliente{tenantsWithActivity !== 1 ? "s" : ""} con actividad</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Últimos 15 minutos</p>
                </div>
                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    title="Actualizar"
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
                </button>
            </div>
        </div>
    );
};
