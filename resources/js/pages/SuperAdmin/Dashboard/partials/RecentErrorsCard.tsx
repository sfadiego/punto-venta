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
                <div className="grid grid-cols-[70px_60px_1fr_140px_80px] gap-3 pb-2 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    <span>Origen</span>
                    <span>Código</span>
                    <span>Mensaje</span>
                    <span>Tenant</span>
                    <span>Cuándo</span>
                </div>
                {errors.map((error, i) => (
                    <div
                        key={i}
                        className="grid grid-cols-[70px_60px_1fr_140px_80px] gap-3 items-center py-2.5 border-b border-slate-50 last:border-0"
                    >
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit ${sourceBadge(error.source)}`}>
                            {error.source}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">{error.status_code ?? "—"}</span>
                        <span className="text-sm text-slate-700 truncate">{error.error_message ?? "—"}</span>
                        <span className="text-xs text-slate-500 truncate">{error.tenant_slug ?? "—"}</span>
                        <span className="text-xs text-slate-400">{formatTimeAgo(error.created_at)}</span>
                    </div>
                ))}
            </div>
        )}
    </div>
);
