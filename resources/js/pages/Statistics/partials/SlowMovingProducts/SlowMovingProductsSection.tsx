import { PackageX } from "lucide-react";
import { SlowMovingSummaryCards } from "./SlowMovingSummaryCards";
import { SlowMovingFilters } from "./SlowMovingFilters/SlowMovingFilters";
import { SlowMovingExportButton } from "./SlowMovingExportButton";
import { SlowMovingTable } from "./SlowMovingTable/SlowMovingTable";
import { useSlowMovingProductsSection } from "./useSlowMovingProductsSection";

// Reporte de productos con mucho tiempo sin movimiento (retail con inventario): qué productos
// tienen existencia pero no se venden, para decidir rebajas o promociones.
export const SlowMovingProductsSection = () => {
    const section = useSlowMovingProductsSection();

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <PackageX size={20} className="text-orange-500" />
                        <h2 className="text-sm font-semibold text-stone-800">Productos sin movimiento</h2>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">
                        Productos con existencia que no se venden ni se reabastecen. El detalle completo (ingreso, reabastecimiento, precio y ventas) va en el reporte de ventas en PDF.
                    </p>
                </div>
                <SlowMovingExportButton filters={section.exportFilters} />
            </div>

            <SlowMovingSummaryCards summary={section.summary} days={section.days} />

            <SlowMovingFilters
                days={section.days}
                onDaysChange={section.handleDaysChange}
                search={section.search}
                onSearchChange={section.handleSearchChange}
                categories={section.categories}
                categoryId={section.categoryId}
                onCategoryChange={section.handleCategoryChange}
            />

            <SlowMovingTable
                tableProps={section.tableProps}
                sortStatus={section.sortStatus}
                days={section.days}
                onSortChange={section.handleSortChange}
            />
        </div>
    );
};
