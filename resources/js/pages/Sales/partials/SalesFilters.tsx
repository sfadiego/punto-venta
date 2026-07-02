import { Calendar, X, SlidersHorizontal } from "lucide-react";
import { ICategory } from "@/models/ICategory";
import { Select, SelectOption } from "@/components/ui/form/Select";
import { SalesByCategoryButton } from "./SalesByCategoryModal";

interface SalesFiltersProps {
    fecha: string | null;
    categoriaId?: number | null;
    categories?: ICategory[];
    sellByWeight?: boolean;
    showCategoryReport?: boolean;
    onFechaChange: (value: string | null) => void;
    onCategoriaChange?: (id: number | null) => void;
    onCategoryReport?: () => void;
    onClear: () => void;
}

export const SalesFilters = ({
    fecha,
    categoriaId = null,
    categories = [],
    sellByWeight = false,
    showCategoryReport = false,
    onFechaChange,
    onCategoriaChange,
    onCategoryReport,
    onClear,
}: SalesFiltersProps) => {
    const hasActive = !!fecha || categoriaId !== null;

    const categoryOptions: SelectOption[] = [
        { value: "", label: "Todas las categorías" },
        ...categories.map((cat) => ({
            value: String(cat.id ?? ""),
            label: cat.nombre,
        })),
    ];

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
                {/* Fecha */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-stone-500">Fecha</label>
                    <div className="relative">
                        <Calendar
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                        />
                        <input
                            type="date"
                            value={fecha ?? ""}
                            onChange={(e) => onFechaChange(e.target.value || null)}
                            className="h-9 pl-8 pr-3 rounded-xl border border-stone-200 bg-stone-50
                                text-sm text-stone-700 focus:outline-none focus:ring-2
                                focus:ring-amber-400 focus:border-transparent focus:bg-white
                                transition-all w-44"
                        />
                    </div>
                </div>

                {/* Categoría — solo para negocios con sell_by_weight */}
                {sellByWeight && categories.length > 0 && onCategoriaChange && (
                    <div className="flex flex-col gap-1.5 w-52">
                        <label className="text-xs font-medium text-stone-500">Categoría</label>
                        <Select<{ categoria: string }>
                            name="categoria"
                            options={categoryOptions}
                            value={categoriaId !== null ? String(categoriaId) : ""}
                            onChange={(val) => onCategoriaChange(val ? Number(val) : null)}
                            selectStyle="default"
                            className="!py-0 h-9 !text-sm"
                        />
                    </div>
                )}

                {hasActive && (
                    <button
                        onClick={onClear}
                        className="h-9 flex items-center gap-1.5 px-3 rounded-xl border
                            border-stone-200 bg-stone-50 text-xs font-medium text-stone-400
                            hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all self-end"
                    >
                        <X size={13} />
                        Limpiar
                    </button>
                )}

                {showCategoryReport && onCategoryReport && (
                    <div className="ml-auto self-end">
                        <SalesByCategoryButton onClick={onCategoryReport} />
                    </div>
                )}
            </div>
        </div>
    );
};
