import { SlidersHorizontal } from "lucide-react";
import { ICategory } from "@/models/ICategory";
import { SalesReportModeEnum } from "@/enums/SalesReportModeEnum";
import { SalesByCategoryButton } from "../SalesByCategoryModal/SalesByCategoryModal";
import { ReportModeToggle } from "./ReportModeToggle";
import { SalesPeriodInput } from "./SalesPeriodInput";
import { SalesCategoryFilter } from "./SalesCategoryFilter";
import { ClearFiltersButton } from "./ClearFiltersButton";

interface SalesFiltersProps {
    fecha: string | null;
    mes: string | null;
    reportMode: SalesReportModeEnum;
    categoriaId?: number | null;
    categories?: ICategory[];
    sellByWeight?: boolean;
    showCategoryReport?: boolean;
    categoryReportLabel?: string;
    onReportModeChange: (mode: SalesReportModeEnum) => void;
    onFechaChange: (value: string | null) => void;
    onMesChange: (value: string | null) => void;
    onCategoriaChange?: (id: number | null) => void;
    onCategoryReport?: () => void;
    onClear: () => void;
}

export const SalesFilters = ({
    fecha,
    mes,
    reportMode,
    categoriaId = null,
    categories = [],
    sellByWeight = false,
    showCategoryReport = false,
    categoryReportLabel,
    onReportModeChange,
    onFechaChange,
    onMesChange,
    onCategoriaChange,
    onCategoryReport,
    onClear,
}: SalesFiltersProps) => {
    const hasActive = (reportMode === SalesReportModeEnum.Day ? !!fecha : !!mes) || categoriaId !== null;

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
                <ReportModeToggle reportMode={reportMode} onChange={onReportModeChange} />

                <SalesPeriodInput
                    reportMode={reportMode}
                    fecha={fecha}
                    mes={mes}
                    onFechaChange={onFechaChange}
                    onMesChange={onMesChange}
                />

                {sellByWeight && categories.length > 0 && onCategoriaChange && (
                    <SalesCategoryFilter
                        categoriaId={categoriaId}
                        categories={categories}
                        onChange={onCategoriaChange}
                    />
                )}

                {hasActive && <ClearFiltersButton onClick={onClear} />}

                {showCategoryReport && onCategoryReport && (
                    <div className="w-full lg:w-auto lg:ml-auto self-end">
                        <SalesByCategoryButton onClick={onCategoryReport} label={categoryReportLabel} />
                    </div>
                )}
            </div>
        </div>
    );
};
