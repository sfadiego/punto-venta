import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatWeekLabel, getWeekStart, shiftWeek } from "@/utils/dateUtils";

interface WeekPickerProps {
    value: string; // YYYY-MM-DD, lunes de la semana
    onChange: (value: string) => void;
}

export const WeekPicker = ({ value, onChange }: WeekPickerProps) => {
    const currentWeekStart = getWeekStart();
    const isCurrentOrFuture = value >= currentWeekStart;

    return (
        <div className="flex items-center gap-1 h-9 rounded-xl border border-stone-200 bg-white pl-1 pr-3">
            <button
                type="button"
                onClick={() => onChange(shiftWeek(value, -1))}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                title="Semana anterior"
            >
                <ChevronLeft size={14} />
            </button>
            <span className="text-sm text-stone-700 font-medium whitespace-nowrap px-1">
                {formatWeekLabel(value)}
            </span>
            <button
                type="button"
                onClick={() => onChange(shiftWeek(value, 1))}
                disabled={isCurrentOrFuture}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors
                    disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-400 disabled:cursor-not-allowed"
                title="Semana siguiente"
            >
                <ChevronRight size={14} />
            </button>
        </div>
    );
};
