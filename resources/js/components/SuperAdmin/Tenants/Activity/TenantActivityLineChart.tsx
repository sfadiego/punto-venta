import {
    Line,
    LineChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { IDailyActivityPoint } from "@/models/ITenantActivity";

interface TenantActivityLineChartProps {
    data: IDailyActivityPoint[];
}

const formatDateLabel = (date: string): string => {
    const [, month, day] = date.split("-");
    return `${day}/${month}`;
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: IDailyActivityPoint }[] }) => {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3">
            <p className="text-xs text-slate-400">{formatDateLabel(point.date)}</p>
            <p className="text-sm font-semibold text-slate-800">
                {point.count} evento{point.count !== 1 ? "s" : ""}
            </p>
        </div>
    );
};

export const TenantActivityLineChart = ({ data }: TenantActivityLineChartProps) => (
    <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
            />
            <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                width={28}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
                type="monotone"
                dataKey="count"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
            />
        </LineChart>
    </ResponsiveContainer>
);
