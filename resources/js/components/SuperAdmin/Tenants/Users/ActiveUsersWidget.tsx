import { Activity, RefreshCw } from "lucide-react";
import { ITenant } from "@/models/ITenant";

interface ActiveUsersWidgetProps {
    tenants: ITenant[];
    onRefresh: () => void;
    isRefreshing: boolean;
}

// Fila compacta (icono + label + valor) — sin detalle secundario ("X clientes con
// actividad", "últimos 15 min"): el widget ya se refresca solo cada 30s, y el detalle no
// aporta lo suficiente como para justificar el espacio/alto extra que ocupaba.
export const ActiveUsersWidget = ({ tenants, onRefresh, isRefreshing }: ActiveUsersWidgetProps) => {
    const totalActive = tenants.reduce((sum, t) => sum + (t.active_users_count ?? 0), 0);

    return (
        <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <Activity size={16} className="text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400 font-medium truncate">Usuarios activos</p>
                <p className="text-lg font-bold text-slate-900 leading-tight">{totalActive}</p>
            </div>
            <button
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Actualizar"
                className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-300 hover:text-slate-600 transition-colors disabled:opacity-50 shrink-0"
            >
                <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
            </button>
        </div>
    );
};
