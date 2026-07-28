const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface MonthPickerProps {
    value: string; // YYYY-MM
    onChange: (value: string) => void;
}

export const MonthPicker = ({ value, onChange }: MonthPickerProps) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const [year, month] = value.split("-").map(Number);

    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const handleMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(`${year}-${String(e.target.value).padStart(2, "0")}`);
    };

    const handleYear = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newYear = Number(e.target.value);
        // If switching to current year and selected month is in the future, clamp to current month
        const clampedMonth = newYear === currentYear && month > currentMonth ? currentMonth : month;
        onChange(`${newYear}-${String(clampedMonth).padStart(2, "0")}`);
    };

    const isMonthDisabled = (m: number) => year === currentYear && m > currentMonth;

    const selectClass =
        "h-9 px-3 pr-8 rounded-xl border border-stone-200 bg-white text-sm text-stone-700 " +
        "focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent " +
        "transition-all appearance-none cursor-pointer";

    return (
        <div className="flex items-center gap-2">
            <div className="relative">
                <select value={month} onChange={handleMonth} className={selectClass}>
                    {MONTHS.map((name, i) => {
                        const m = i + 1;
                        return (
                            <option key={m} value={m} disabled={isMonthDisabled(m)}>
                                {name}
                            </option>
                        );
                    })}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">▾</span>
            </div>
            <div className="relative">
                <select value={year} onChange={handleYear} className={selectClass}>
                    {years.map((y) => (
                        <option key={y} value={y}>
                            {y}
                        </option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">▾</span>
            </div>
        </div>
    );
};
