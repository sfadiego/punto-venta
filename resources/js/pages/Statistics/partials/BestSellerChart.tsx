import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList,
} from "recharts";
import { IBestSellerItem } from "@/services/useStatisticsService";

const COLORS = ["#f59e0b", "#fbbf24", "#fcd34d"];
const MEDALS = ["🥇", "🥈", "🥉"];

interface BestSellerChartProps {
    data: IBestSellerItem[];
}

export const formatTotal = (total: number, unidad: string): string => {
    if (unidad === "kg" || unidad === "gr") return `${total.toFixed(3)} ${unidad}`;
    return `${total} und`;
};

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    const unidad: string = item.payload.unidad_medida ?? "unidad";
    return (
        <div className="bg-white border border-stone-200 rounded-xl shadow-lg px-4 py-3">
            <p className="text-sm font-semibold text-stone-800">{item.payload.product}</p>
            <p className="text-xs text-stone-500 mt-0.5">
                <span className="font-bold text-amber-600 text-base">{item.value}</span>{" "}
                {unidad === "kg" || unidad === "gr" ? `${unidad} vendidos` : "unidades vendidas"}
            </p>
        </div>
    );
};

export const BestSellerChart = ({ data }: BestSellerChartProps) => {
    if (!data.length) return null;

    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 8 }} barSize={56}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis
                    dataKey="product"
                    tick={{ fontSize: 13, fill: "#78716c", fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#a8a29e" }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#fef3c7", radius: 8 }} />
                <Bar dataKey="total" radius={[10, 10, 0, 0]}>
                    {data.map((_, index) => (
                        <Cell key={index} fill={COLORS[index] ?? "#e7e5e4"} />
                    ))}
                    <LabelList
                        dataKey="total"
                        position="top"
                        style={{ fontSize: 13, fontWeight: 700, fill: "#78716c" }}
                    />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

interface BestSellerRankingProps {
    data: IBestSellerItem[];
}

export const BestSellerRanking = ({ data }: BestSellerRankingProps) => (
    <div className="space-y-3">
        {data.map((item, index) => {
            const max = data[0]?.total ?? 1;
            const pct = Math.round((item.total / max) * 100);
            return (
                <div key={item.id} className="flex items-center gap-4">
                    <span className="text-xl w-7 text-center shrink-0">{MEDALS[index]}</span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-stone-800 truncate">{item.product}</p>
                            <span className="text-sm font-bold text-amber-600 shrink-0 ml-2">
                                {formatTotal(item.total, item.unidad_medida)}
                            </span>
                        </div>
                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                    width: `${pct}%`,
                                    backgroundColor: COLORS[index] ?? "#e7e5e4",
                                }}
                            />
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
);
