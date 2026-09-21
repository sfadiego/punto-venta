import { IDashboardRecentError } from "@/models/IDashboard";
import { formatTimeAgo } from "@/utils/dateUtils";

interface RecentErrorsCardProps {
    errors: IDashboardRecentError[];
}

const sourceBadge = (source: string) =>
    source === "backend" ? "text-red-600 bg-red-50" : "text-amber-600 bg-amber-50";

export const RecentErrorsCard = ({ errors }: RecentErrorsCardProps) => (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Errores recientes del sistema</h2>
        {errors.length === 0 ? (
            <p className="text-sm text-slate-400">Sin errores registrados.</p>
        ) : (
            <div className="flex flex-col">
                {errors.map((error, i) => (
                    <div key={i} className="flex flex-col gap-1 py-2.5 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${sourceBadge(error.source)}`}>
                                {error.source}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 shrink-0">{error.status_code ?? "—"}</span>
                            {error.tenant_slug && (
                                <span className="text-xs text-slate-400 truncate">{error.tenant_slug}</span>
                            )}
                            <span className="text-xs text-slate-400 ml-auto shrink-0">{formatTimeAgo(error.created_at)}</span>
                        </div>
                        <p className="text-sm text-slate-700 truncate">{error.error_message ?? "—"}</p>
                    </div>
                ))}
            </div>
        )}
    </div>
);
