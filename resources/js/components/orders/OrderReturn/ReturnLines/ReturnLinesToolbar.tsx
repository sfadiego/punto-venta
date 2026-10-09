interface ReturnLinesToolbarProps {
    selectedCount: number;
    returnableCount: number;
    allReturnableSelected: boolean;
    onSelectAll: () => void;
    onClearSelection: () => void;
}

// "Devolver todo" y el contador de seleccionados — encima de la lista, fuera de su desplazamiento,
// para que siempre estén a la mano aunque la venta tenga decenas de productos.
export const ReturnLinesToolbar = ({
    selectedCount,
    returnableCount,
    allReturnableSelected,
    onSelectAll,
    onClearSelection,
}: ReturnLinesToolbarProps) => (
    <div className="flex items-center justify-between gap-3 px-3.5">
        <p className="text-xs text-stone-500">
            {selectedCount} de {returnableCount} seleccionados
        </p>
        <button
            type="button"
            onClick={allReturnableSelected ? onClearSelection : onSelectAll}
            className="shrink-0 text-sm font-semibold text-amber-600 transition-colors hover:text-amber-700"
        >
            {allReturnableSelected ? "Quitar selección" : "Devolver todo"}
        </button>
    </div>
);
