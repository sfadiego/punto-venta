import { WorkDay } from "@/models/IEmployee";
import { WORK_DAYS_ORDER, WORK_DAY_LABELS } from "@/utils/workDaysUtils";

interface WorkDaysCheckboxGroupProps {
    label?: string;
    value: WorkDay[];
    onChange: (days: WorkDay[]) => void;
    error?: string;
}

export const WorkDaysCheckboxGroup = ({ label, value, onChange, error }: WorkDaysCheckboxGroupProps) => {
    const toggleDay = (day: WorkDay) => {
        onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day]);
    };

    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-stone-700 mb-1.5">{label}</label>}
            <div className="flex flex-wrap gap-2">
                {WORK_DAYS_ORDER.map((day) => {
                    const active = value.includes(day);
                    return (
                        <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                active
                                    ? "bg-amber-500 border-amber-500 text-white"
                                    : "bg-white border-stone-200 text-stone-500 hover:border-amber-300"
                            }`}
                        >
                            {WORK_DAY_LABELS[day]}
                        </button>
                    );
                })}
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};
