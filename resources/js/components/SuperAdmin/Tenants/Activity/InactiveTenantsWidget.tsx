import { AlertTriangle } from "lucide-react";
import { ITenant } from "@/models/ITenant";
import { daysSince } from "@/utils/dateUtils";

const WARNING_DAYS = 7;
const CRITICAL_DAYS = 14;

interface InactiveTenantsWidgetProps {
    tenants: ITenant[];
}

export const InactiveTenantsWidget = ({ tenants }: InactiveTenantsWidgetProps) => {
    const eligibleTenants = tenants.filter((t) => t.activo && !t.is_demo && !t.deleted_at);
    const daysList = eligibleTenants.map((t) => daysSince(t.last_activity_at));
    const atRisk = daysList.filter((d) => d !== null && d >= WARNING_DAYS).length;
    const critical = daysList.filter((d) => d !== null && d >= CRITICAL_DAYS).length;

    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${critical > 0 ? "bg-red-50" : "bg-amber-50"}`}>
                <AlertTriangle size={18} className={critical > 0 ? "text-red-600" : "text-amber-600"} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Sin actividad reciente</p>
                <p className="text-2xl font-bold text-slate-900 leading-tight">{atRisk}</p>
            </div>
            <div className="text-right shrink-0">
                <p className="text-sm text-slate-500">
                    {critical} crítico{critical !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">≥{WARNING_DAYS} días</p>
            </div>
        </div>
    );
};
