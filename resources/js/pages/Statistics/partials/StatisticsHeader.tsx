import { MonthPicker } from "./MonthPicker";

interface StatisticsHeaderProps {
    formattedMonth: string;
    month: string;
    onMonthChange: (value: string) => void;
}

export const StatisticsHeader = ({ formattedMonth, month, onMonthChange }: StatisticsHeaderProps) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
            <h1 className="text-2xl font-bold text-stone-900">Estadísticas</h1>
            <p className="text-stone-500 text-sm mt-0.5 capitalize">{formattedMonth}</p>
        </div>

        <div className="self-start sm:self-auto">
            <MonthPicker value={month} onChange={onMonthChange} />
        </div>
    </div>
);
