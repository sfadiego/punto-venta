import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ShoppingCart } from "lucide-react";
import { IHourlyActivityPoint, ITenantTodaySales } from "@/models/ITenantActivity";

interface TenantTodaySalesWidgetProps {
    todaySales?: ITenantTodaySales;
}

const formatHourLabel = (hour: number): string => `${String(hour).padStart(2, "0")}:00`;

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: IHourlyActivityPoint }[] }) => {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2">
            <p className="text-xs text-slate-400">{formatHourLabel(point.hour)}</p>
            <p className="text-sm font-semibold text-slate-800">
                {point.count} venta{point.count !== 1 ? "s" : ""}
            </p>
        </div>
    );
};

export const TenantTodaySalesWidget = ({ todaySales }: TenantTodaySalesWidgetProps) => {
    const total = todaySales?.total ?? 0;

    return (
        <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 sm:w-48 shrink-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <ShoppingCart size={16} className="text-emerald-600" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-slate-400 font-medium truncate">Ventas de hoy</p>
                    <p className="text-lg font-bold leading-tight text-slate-900">{total}</p>
                </div>
            </div>
            <div className="h-16 min-w-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={todaySales?.hourly ?? []} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barSize={8}>
                        <XAxis
                            dataKey="hour"
                            tickFormatter={formatHourLabel}
                            tick={{ fontSize: 9, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                            interval={3}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ecfdf5" }} />
                        <Bar dataKey="count" fill="#059669" radius={[3, 3, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
