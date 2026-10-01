import { Clock } from "lucide-react";
import { TenantActivityHourlyChart } from "@/components/SuperAdmin/Tenants/Activity/TenantActivityHourlyChart";
import { IDashboardUsageHourly } from "@/models/IDashboard";

interface PeakUsageHourCardProps {
    usage: IDashboardUsageHourly;
}

const formatHourRange = (hour: number): string =>
    `${String(hour).padStart(2, "0")}:00 - ${String((hour + 1) % 24).padStart(2, "0")}:00`;

export const PeakUsageHourCard = ({ usage }: PeakUsageHourCardProps) => (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Horario de mayor uso (últimos 30 días)</h2>
            {usage.peak_hour !== null && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                    <Clock size={12} />
                    {formatHourRange(usage.peak_hour)}
                </div>
            )}
        </div>

        {usage.peak_hour === null ? (
            <p className="text-sm text-slate-400 py-8 text-center">Sin actividad registrada todavía.</p>
        ) : (
            <TenantActivityHourlyChart data={usage.hourly} />
        )}
    </div>
);
