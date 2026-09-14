import { useMemo } from "react";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { RefreshCw, Settings2, X } from "lucide-react";
import { IStockMovement } from "@/models/IStockMovement";
import { Input } from "@/components/ui/form/Input";
import { STOCK_MOVEMENT_TYPE_LABELS } from "@/enums/StockMovementTypeEnum";
import { STOCK_MOVEMENT_REASON_LABELS } from "@/enums/StockMovementReasonEnum";
import { trimDecimalZeros } from "@/utils/formatDecimal";
import { formatOrderDateTime } from "@/utils/dateUtils";
import { useInventoryPage } from "./useInventoryPage";
import { ProductAutocomplete } from "./partials/ProductAutocomplete";
import { SelectStockMovementType } from "./partials/SelectStockMovementType";
import { SelectStockMovementReason } from "./partials/SelectStockMovementReason";
import { InventoryActionsModal } from "./partials/InventoryActionsModal/InventoryActionsModal";
import { useInventoryActionsModal } from "./partials/InventoryActionsModal/useInventoryActionsModal";

export default function InventoryPage() {
    const {
        movements,
        total,
        page,
        limit,
        pageSize,
        isLoading,
        refetch,
        setPage,
        setLimit,
        type,
        setType,
        reason,
        setReason,
        fechaDesde,
        setFechaDesde,
        fechaHasta,
        setFechaHasta,
        productFilter,
    } = useInventoryPage();

    const actionsModal = useInventoryActionsModal();

    const columns = useMemo<DataTableColumn<IStockMovement>[]>(
        () => [
            {
                accessor: "created_at",
                title: "Fecha",
                render: (m: IStockMovement) => (
                    <span className="text-sm text-stone-600">{formatOrderDateTime(m.created_at)}</span>
                ),
            },
            {
                accessor: "product_id",
                title: "Producto",
                render: (m: IStockMovement) => (
                    <span className="text-sm text-stone-900 font-medium">
                        {m.product?.nombre ?? `#${m.product_id}`}
                        {m.variant?.nombre && <span className="text-stone-400 font-normal"> ({m.variant.nombre})</span>}
                    </span>
                ),
            },
            {
                accessor: "type",
                title: "Tipo",
                render: (m: IStockMovement) => (
                    <span className="text-sm text-stone-600">{STOCK_MOVEMENT_TYPE_LABELS[m.type]}</span>
                ),
            },
            {
                accessor: "reason",
                title: "Razón",
                render: (m: IStockMovement) => (
                    <span className="text-sm text-stone-600">{STOCK_MOVEMENT_REASON_LABELS[m.reason]}</span>
                ),
            },
            {
                accessor: "quantity",
                title: "Cantidad",
                render: (m: IStockMovement) => (
                    <span className="text-sm tabular-nums text-stone-900 font-medium">{trimDecimalZeros(m.quantity)}</span>
                ),
            },
            {
                accessor: "stock_after",
                title: "Stock antes → después",
                render: (m: IStockMovement) => (
                    <span className="text-sm tabular-nums text-stone-600">
                        {trimDecimalZeros(m.stock_before)} → {trimDecimalZeros(m.stock_after)}
                    </span>
                ),
            },
            {
                accessor: "created_by",
                title: "Usuario",
                render: (m: IStockMovement) => (
                    <span className="text-sm text-stone-600">{m.created_by?.nombre ?? "—"}</span>
                ),
            },
            {
                accessor: "note",
                title: "Nota",
                render: (m: IStockMovement) => (
                    <span className="text-sm text-stone-400">{m.note ?? "—"}</span>
                ),
            },
        ],
        [],
    );

    return (
        <div className="px-5 py-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Inventario</h1>
                    <p className="text-stone-500 text-sm mt-0.5">
                        {total} {total === 1 ? "movimiento registrado" : "movimientos registrados"}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-700 bg-white border border-stone-200 px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors"
                    >
                        <RefreshCw size={15} />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                    <button
                        onClick={() => actionsModal.openModal()}
                        className="flex items-center gap-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl transition-colors shadow-sm shadow-amber-200"
                    >
                        <Settings2 size={16} />
                        Gestionar inventario
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 flex flex-wrap items-end gap-3">
                    <div className="w-full sm:w-56 relative">
                        <ProductAutocomplete
                            value={productFilter.query}
                            onChange={productFilter.handleQueryChange}
                            suggestions={productFilter.suggestions}
                            isOpen={productFilter.isDropdownOpen}
                            setIsOpen={productFilter.setIsDropdownOpen}
                            onSelect={productFilter.selectProduct}
                            label=""
                            placeholder="Filtrar por producto..."
                        />
                        {productFilter.productId && (
                            <button
                                type="button"
                                onClick={productFilter.clear}
                                aria-label="Quitar filtro de producto"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>
                    <div className="w-full sm:w-48">
                        <SelectStockMovementType value={type} onChange={setType} />
                    </div>
                    <div className="w-full sm:w-48">
                        <SelectStockMovementReason value={reason} onChange={setReason} />
                    </div>
                    <div className="w-full sm:w-40">
                        <Input
                            name="fecha_desde"
                            inputType="date"
                            label=""
                            placeholder="Desde"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                        />
                    </div>
                    <div className="w-full sm:w-40">
                        <Input
                            name="fecha_hasta"
                            inputType="date"
                            label=""
                            placeholder="Hasta"
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-4">
                    <DataTable<IStockMovement>
                        columns={columns}
                        records={movements}
                        fetching={isLoading}
                        page={page}
                        recordsPerPage={limit}
                        totalRecords={total}
                        onPageChange={setPage}
                        recordsPerPageOptions={pageSize}
                        onRecordsPerPageChange={setLimit}
                        noRecordsText="No hay movimientos de inventario registrados"
                        highlightOnHover
                        withTableBorder
                        withColumnBorders
                        striped
                        minHeight={300}
                        className="whitespace-nowrap"
                        classNames={{ header: "pos-datatable-header" }}
                        paginationText={({ from, to, totalRecords }) =>
                            `Mostrando del ${from} al ${to} de ${totalRecords} registros`
                        }
                    />
                </div>
            </div>

            <InventoryActionsModal
                isOpen={actionsModal.isOpen}
                activeTab={actionsModal.activeTab}
                setActiveTab={actionsModal.setActiveTab}
                title={actionsModal.title}
                onClose={actionsModal.closeModal}
            />
        </div>
    );
}
