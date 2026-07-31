import {
    Bar,
    BarChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { IHourlyActivityPoint } from "@/models/ITenantActivity";

interface TenantActivityHourlyChartProps {
    data: IHourlyActivityPoint[];
}

const formatHourLabel = (hour: number): string => `${String(hour).padStart(2, "0")}:00`;

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: IHourlyActivityPoint }[] }) => {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3">
            <p className="text-xs text-slate-400">{formatHourLabel(point.hour)}</p>
            <p className="text-sm font-semibold text-slate-800">
                {point.count} evento{point.count !== 1 ? "s" : ""}
            </p>
        </div>
    );
};

export const TenantActivityHourlyChart = ({ data }: TenantActivityHourlyChartProps) => (
    <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }} barSize={10}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
                dataKey="hour"
                tickFormatter={formatHourLabel}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                interval={1}
            />
            <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                width={28}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#eef2ff" }} />
            <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
        </BarChart>
    </ResponsiveContainer>
);
