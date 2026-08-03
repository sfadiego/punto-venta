import { Activity, Loader } from "lucide-react";
import { ACTIVITY_RANGE_OPTIONS, useTenantActivitySection } from "./useTenantActivitySection";
import { TenantActivityLineChart } from "./TenantActivityLineChart";
import { TenantActivityHourlyChart } from "./TenantActivityHourlyChart";
import { InactivityBadge } from "./InactivityBadge";
import { daysSince } from "@/utils/dateUtils";

interface TenantActivitySectionProps {
    tenantId: number;
    lastActivityAt?: string | null;
}

export const TenantActivitySection = ({ tenantId, lastActivityAt }: TenantActivitySectionProps) => {
    const { days, setDays, data, isLoading } = useTenantActivitySection(tenantId);
    const daysWithoutActivity = daysSince(lastActivityAt);

    return (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                        <Activity size={17} className="text-slate-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-slate-900">Actividad del cliente</h2>
                            <InactivityBadge lastActivityAt={lastActivityAt} />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {daysWithoutActivity === null
                                ? "Logins y ventas cerradas a lo largo del tiempo."
                                : daysWithoutActivity === 0
                                ? "Actividad hoy."
                                : `Última actividad hace ${daysWithoutActivity} día${daysWithoutActivity !== 1 ? "s" : ""}.`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {ACTIVITY_RANGE_OPTIONS.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setDays(option)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                days === option
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-500 hover:bg-slate-50"
                            }`}
                        >
                            {option}d
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Loader size={18} className="animate-spin text-slate-400" />
                </div>
            ) : (
                <div className="mt-4 space-y-6">
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                            Actividad diaria
                        </p>
                        <TenantActivityLineChart data={data?.daily ?? []} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                            Horas de más uso
                        </p>
                        <TenantActivityHourlyChart data={data?.hourly ?? []} />
                    </div>
                </div>
            )}
        </section>
    );
};
