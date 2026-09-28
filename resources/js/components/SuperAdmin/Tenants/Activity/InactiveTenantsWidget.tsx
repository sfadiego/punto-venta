import { AlertTriangle } from "lucide-react";
import { ITenant } from "@/models/ITenant";
import { daysSince } from "@/utils/dateUtils";

const WARNING_DAYS = 7;
const CRITICAL_DAYS = 14;

interface InactiveTenantsWidgetProps {
    tenants: ITenant[];
}

// Fila compacta — mismo criterio que ActiveUsersWidget. El desglose de "críticos" se
// resume en el color del ícono/valor en vez de una línea de texto aparte.
export const InactiveTenantsWidget = ({ tenants }: InactiveTenantsWidgetProps) => {
    const eligibleTenants = tenants.filter((t) => t.activo && !t.is_demo && !t.deleted_at);
    const daysList = eligibleTenants.map((t) => daysSince(t.last_activity_at));
    const atRisk = daysList.filter((d) => d !== null && d >= WARNING_DAYS).length;
    const critical = daysList.filter((d) => d !== null && d >= CRITICAL_DAYS).length;

    return (
        <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${critical > 0 ? "bg-red-50" : "bg-amber-50"}`}>
                <AlertTriangle size={16} className={critical > 0 ? "text-red-600" : "text-amber-600"} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400 font-medium truncate">Sin actividad (≥{WARNING_DAYS}d)</p>
                <p className={`text-lg font-bold leading-tight ${critical > 0 ? "text-red-600" : "text-slate-900"}`}>{atRisk}</p>
            </div>
        </div>
    );
};
