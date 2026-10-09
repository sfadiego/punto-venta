import { OrderReturnPanelState } from "./useOrderReturnPanel";
import { OrderAutocomplete } from "./ReturnOrder/OrderAutocomplete";
import { ReturnFooter } from "./ReturnFooter/ReturnFooter";
import { ReturnLinesList } from "./ReturnLines/ReturnLinesList";
import { ReturnLinesToolbar } from "./ReturnLines/ReturnLinesToolbar";
import { ReturnOrderSummary } from "./ReturnOrder/ReturnOrderSummary";

export const OrderReturnPanel = ({
    query,
    handleQueryChange,
    suggestions,
    isDropdownOpen,
    setIsDropdownOpen,
    selectOrder,
    changeOrder,
    canChangeOrder,
    order,
    isLoadingOrder,
    isOrderClosed,
    returnWindowError,
    lines,
    lineEntries,
    formik,
    selectedCount,
    returnableCount,
    piecesCount,
    allReturnableSelected,
    toggleLine,
    setQuantity,
    selectAll,
    clearSelection,
    setRefund,
    setPaymentMethod,
    refund,
}: OrderReturnPanelState) => (
    <div className="space-y-4">
        {order ? (
            <ReturnOrderSummary orderId={order.id} orderName={order.nombre_pedido} productsCount={lines.length} onChange={canChangeOrder ? changeOrder : undefined} />
        ) : (
            <OrderAutocomplete
                value={query}
                onChange={handleQueryChange}
                suggestions={suggestions}
                isOpen={isDropdownOpen}
                setIsOpen={setIsDropdownOpen}
                onSelect={selectOrder}
            />
        )}

        {isLoadingOrder && <p className="text-sm text-stone-400">Cargando orden...</p>}
        {order && !isOrderClosed && (
            <p className="text-sm text-red-500">Solo se pueden devolver productos de órdenes ya cerradas.</p>
        )}

        {order && isOrderClosed && returnWindowError && <p className="text-sm text-red-500">{returnWindowError}</p>}

        {order && !isLoadingOrder && isOrderClosed && !returnWindowError && (
            <form onSubmit={formik.handleSubmit} noValidate className="space-y-3">
                <ReturnLinesToolbar
                    selectedCount={selectedCount}
                    returnableCount={returnableCount}
                    allReturnableSelected={allReturnableSelected}
                    onSelectAll={selectAll}
                    onClearSelection={clearSelection}
                />
                <ReturnLinesList entries={lineEntries} formik={formik} onToggleLine={toggleLine} onQuantityChange={setQuantity} />
                <ReturnFooter
                    formik={formik}
                    selectedCount={selectedCount}
                    piecesCount={piecesCount}
                    refund={refund}
                    onToggleRefund={setRefund}
                    onSelectMethod={setPaymentMethod}
                    customerName={order.customer?.name}
                />
            </form>
        )}
    </div>
);
