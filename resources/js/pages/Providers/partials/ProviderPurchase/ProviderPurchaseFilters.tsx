import { Calendar, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { MonthPicker } from "@/components/ui/form/MonthPicker";
import { WeekPicker } from "@/components/ui/form/WeekPicker";
import { SalesReportModeEnum } from "@/enums/SalesReportModeEnum";
import { getWeekStart, localDateString } from "@/utils/dateUtils";

interface ProviderPurchaseFiltersProps {
    reportMode: SalesReportModeEnum;
    fecha: string | null;
    semana: string | null;
    mes: string | null;
    onReportModeChange: (mode: SalesReportModeEnum) => void;
    onFechaChange: (value: string | null) => void;
    onSemanaChange: (value: string | null) => void;
    onMesChange: (value: string | null) => void;
    onClear: () => void;
}

const MODES: { mode: SalesReportModeEnum; label: string }[] = [
    { mode: SalesReportModeEnum.Day, label: "Día" },
    { mode: SalesReportModeEnum.Week, label: "Semana" },
    { mode: SalesReportModeEnum.Month, label: "Mes" },
];

export const ProviderPurchaseFilters = ({
    reportMode,
    fecha,
    semana,
    mes,
    onReportModeChange,
    onFechaChange,
    onSemanaChange,
    onMesChange,
    onClear,
}: ProviderPurchaseFiltersProps) => {
    const hasActive =
        reportMode === SalesReportModeEnum.Day
            ? !!fecha
            : reportMode === SalesReportModeEnum.Week
                ? !!semana
                : !!mes;

    return (
        <div className="flex flex-col gap-3 mb-5">
            <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-stone-400" />
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    Filtros
                </span>
                {hasActive && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                        activos
                    </span>
                )}
            </div>

            <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-stone-500">Período</label>
                    <div className="flex h-9 rounded-xl border border-stone-200 overflow-hidden text-xs">
                        {MODES.map(({ mode, label }) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => onReportModeChange(mode)}
                                className={`px-3 font-medium transition-colors ${
                                    reportMode === mode
                                        ? "bg-amber-500 text-white"
                                        : "bg-stone-50 text-stone-500 hover:bg-stone-100"
                                } ${mode !== SalesReportModeEnum.Day ? "border-l border-stone-200" : ""}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-stone-500">
                        {reportMode === SalesReportModeEnum.Day ? "Fecha" : reportMode === SalesReportModeEnum.Week ? "Semana" : "Mes"}
                    </label>
                    {reportMode === SalesReportModeEnum.Day ? (
                        <div className="relative">
                            <Calendar
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none z-10"
                            />
                            <Input
                                name="fecha"
                                inputType="date"
                                value={fecha ?? ""}
                                onChange={(e) => onFechaChange(e.target.value || null)}
                                className="!h-9 !py-0 !pl-8 !pr-3 !rounded-xl !border-stone-200 !bg-stone-50 !text-sm w-44"
                            />
                        </div>
                    ) : reportMode === SalesReportModeEnum.Week ? (
                        <WeekPicker value={semana ?? getWeekStart()} onChange={onSemanaChange} />
                    ) : (
                        <MonthPicker value={mes ?? localDateString().slice(0, 7)} onChange={onMesChange} />
                    )}
                </div>

                {hasActive && (
                    <button
                        onClick={onClear}
                        className="h-9 flex items-center gap-1.5 px-3 rounded-xl border
                            border-stone-200 bg-stone-50 text-xs font-medium text-stone-400
                            hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                        <X size={13} />
                        Limpiar
                    </button>
                )}
            </div>
        </div>
    );
};
