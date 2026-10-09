import { SlidersHorizontal } from "lucide-react";
import { SalesReportModeEnum } from "@/enums/SalesReportModeEnum";
import { SalesByCategoryButton } from "../SalesByCategoryModal/SalesByCategoryModal";
import { ReportModeToggle } from "./ReportModeToggle";
import { SalesPeriodInput } from "./SalesPeriodInput";
import { ClearFiltersButton } from "./ClearFiltersButton";
import { SalesSearch } from "./SalesSearch";

interface SalesFiltersProps {
    fecha: string | null;
    semana: string | null;
    mes: string | null;
    reportMode: SalesReportModeEnum;
    search: string;
    showCategoryReport?: boolean;
    categoryReportLabel?: string;
    onReportModeChange: (mode: SalesReportModeEnum) => void;
    onFechaChange: (value: string | null) => void;
    onSemanaChange: (value: string | null) => void;
    onMesChange: (value: string | null) => void;
    onCategoryReport?: () => void;
    onSearchChange: (value: string) => void;
    onClear: () => void;
}

export const SalesFilters = ({
    fecha,
    semana,
    mes,
    reportMode,
    search,
    showCategoryReport = false,
    categoryReportLabel,
    onReportModeChange,
    onFechaChange,
    onSemanaChange,
    onMesChange,
    onCategoryReport,
    onSearchChange,
    onClear,
}: SalesFiltersProps) => {
    const activeByMode: Record<SalesReportModeEnum, boolean> = {
        [SalesReportModeEnum.Day]: !!fecha,
        [SalesReportModeEnum.Week]: !!semana,
        [SalesReportModeEnum.Month]: !!mes,
    };
    const isSearching = search.trim() !== "";
    const hasActive = activeByMode[reportMode] || isSearching;

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
                <SalesSearch value={search} onChange={onSearchChange} />

                {/* Al buscar, el periodo no aplica: se atenúa para no sugerir que filtra. */}
                <div className={`flex flex-wrap gap-3 items-end transition-opacity ${isSearching ? "opacity-40 pointer-events-none" : ""}`}>
                    <ReportModeToggle reportMode={reportMode} onChange={onReportModeChange} />

                    <SalesPeriodInput
                        reportMode={reportMode}
                        fecha={fecha}
                        semana={semana}
                        mes={mes}
                        onFechaChange={onFechaChange}
                        onSemanaChange={onSemanaChange}
                        onMesChange={onMesChange}
                    />
                </div>

                {hasActive && <ClearFiltersButton onClick={onClear} />}

                {showCategoryReport && onCategoryReport && (
                    <div className="w-full lg:w-auto lg:ml-auto self-end">
                        <SalesByCategoryButton onClick={onCategoryReport} label={categoryReportLabel} />
                    </div>
                )}
            </div>

            {isSearching && (
                <p className="text-xs text-stone-400">
                    Buscando en todo el historial de ventas, sin importar el periodo.
                </p>
            )}
        </div>
    );
};
