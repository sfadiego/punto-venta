import { IDashboardStaleTenant } from "@/models/IDashboard";
import { formatTimeAgo } from "@/utils/dateUtils";

interface StaleTenantsCardProps {
    tenants: IDashboardStaleTenant[];
}

export const StaleTenantsCard = ({ tenants }: StaleTenantsCardProps) => (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Sin actividad reciente</h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">+14 días</span>
        </div>
        {tenants.length === 0 ? (
            <p className="text-sm text-slate-400">Todos los tenants tienen actividad reciente.</p>
        ) : (
            <div className="flex flex-col">
                {tenants.map((tenant) => (
                    <div
                        key={tenant.id}
                        className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-50 last:border-0"
                    >
                        <p className="text-sm font-medium text-slate-800 truncate">{tenant.business_name}</p>
                        <span className="text-xs text-slate-400 shrink-0">{formatTimeAgo(tenant.last_activity_at)}</span>
                    </div>
                ))}
            </div>
        )}
    </div>
);
