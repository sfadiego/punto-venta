import { DataTable } from "mantine-datatable";
import { ShoppingBag, RefreshCw } from "lucide-react";
import { useSalesPage } from "./useSalesPage";
import { SalesFilters } from "./partials/SalesFilters";
import { OrderDetailModal } from "./partials/OrderDetailModal";
import { SalesByCategoryModal } from "./partials/SalesByCategoryModal";
import { useSalesByCategoryModal } from "./partials/useSalesByCategoryModal";

export default function SalesPage() {
    const { dataTableProps, isLoading, refetch, fecha, categoriaId, categories, sellByWeight, handleFechaChange, handleCategoriaChange, handleClear, modal } =
        useSalesPage();

    const categoryModal = useSalesByCategoryModal();

    return (
        <div className="px-5 py-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Ventas</h1>
                    <p className="text-stone-500 text-sm mt-0.5">
                        Historial de órdenes cerradas
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 text-sm font-medium text-stone-500
                        hover:text-stone-700 bg-white border border-stone-200 px-3 py-2
                        rounded-xl hover:bg-stone-50 transition-colors"
                >
                    <RefreshCw size={15} />
                    Actualizar
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
                <SalesFilters
                    fecha={fecha}
                    categoriaId={categoriaId}
                    categories={categories}
                    sellByWeight={sellByWeight}
                    showCategoryReport={sellByWeight && !!categoryModal.sistemaId}
                    onFechaChange={handleFechaChange}
                    onCategoriaChange={handleCategoriaChange}
                    onCategoryReport={categoryModal.open}
                    onClear={handleClear}
                />

                {dataTableProps.columns.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center gap-3 py-16">
                        <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center">
                            <ShoppingBag size={22} className="text-stone-300" />
                        </div>
                        <p className="text-stone-400 text-sm">No hay ventas registradas</p>
                    </div>
                ) : (
                    <DataTable fetching={isLoading} {...dataTableProps} />
                )}
            </div>

            <OrderDetailModal
                isOpen={modal.isOpen}
                order={modal.order}
                onClose={modal.close}
            />

            <SalesByCategoryModal
                isOpen={categoryModal.isOpen}
                onClose={categoryModal.close}
                data={categoryModal.data}
                isLoading={categoryModal.isLoading}
                totalBruto={categoryModal.totalBruto}
                totalDomicilios={categoryModal.totalDomicilios}
                totalNeto={categoryModal.totalNeto}
                sistemaId={categoryModal.sistemaId}
            />
        </div>
    );
}
