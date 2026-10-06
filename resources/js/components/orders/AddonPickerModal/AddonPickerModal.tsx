import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IAddon, IAddonSelection } from "@/models/IAddon";
import { formatMoney } from "@/utils/formatCurrency";
import { AddonPickerRow } from "./AddonPickerRow";
import { useAddonPickerModal } from "./useAddonPickerModal";

interface AddonPickerModalProps {
    isOpen: boolean;
    /** Nombre del producto (con la variante, si aplica). */
    title: string;
    /** Precio unitario del producto o variante, sin toppings. */
    basePrice: number;
    /** Toppings activos que se ofrecen con el producto. */
    addons: IAddon[];
    /** Selección elegida; vacía = agregar sin toppings (o quitarlos todos al editar). */
    onConfirm: (selection: IAddonSelection[]) => void;
    onClose: () => void;
    /** "add" = al agregar un producto (default); "edit" = cambiar los toppings de una línea ya agregada. */
    mode?: "add" | "edit";
    /** Toppings con los que se abre (modo edición). */
    initialSelection?: IAddonSelection[];
    /** Aviso opcional sobre la lista, ej. toppings que ya no están disponibles. */
    notice?: string | null;
}

const NO_SELECTION: IAddonSelection[] = [];

// Selector de toppings al agregar un producto a la orden. Recibe todo por props (global, sin
// conocer IProduct ni el carrito de ninguna página). Portal + hoja inferior en mobile, igual que
// VariantPickerModal, para que nunca quede recortado por un ancestro con overflow.
export const AddonPickerModal = ({
    isOpen,
    title,
    basePrice,
    addons,
    onConfirm,
    onClose,
    mode = "add",
    initialSelection = NO_SELECTION,
    notice = null,
}: AddonPickerModalProps) => {
    const picker = useAddonPickerModal(isOpen, addons, basePrice, initialSelection, onConfirm);
    const isEdit = mode === "edit";

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 border-b border-stone-100">
                    <div className="min-w-0">
                        <h2 className="font-semibold text-stone-900 text-sm truncate">{title}</h2>
                        <p className="text-xs text-stone-400 mt-0.5">
                            {isEdit ? "Cambia los toppings de esta línea" : "Elige los toppings"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="w-8 h-8 shrink-0 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {notice && <p className="mx-5 mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{notice}</p>}

                <div className="px-2 py-1 divide-y divide-stone-100 overflow-y-auto">
                    {addons.length === 0 && (
                        <p className="px-3 py-6 text-center text-sm text-stone-400">Este producto no tiene toppings disponibles.</p>
                    )}
                    {addons.map((addon) => (
                        <AddonPickerRow
                            key={addon.id}
                            addon={addon}
                            quantity={picker.quantities[addon.id] ?? 0}
                            onAdd={picker.add}
                            onRemove={picker.remove}
                        />
                    ))}
                </div>

                <div className="flex gap-2 px-5 pt-3 pb-5 border-t border-stone-100">
                    <button
                        type="button"
                        onClick={picker.confirmWithoutAddons}
                        className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
                    >
                        {isEdit ? "Quitar toppings" : "Sin toppings"}
                    </button>
                    <button
                        type="button"
                        onClick={picker.confirmWithAddons}
                        disabled={picker.selectedCount === 0}
                        className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity disabled:bg-stone-300 disabled:cursor-not-allowed"
                        style={picker.selectedCount === 0 ? undefined : { backgroundColor: "var(--color-primary)" }}
                    >
                        {picker.selectedCount === 0
                            ? isEdit ? "Guardar" : "Agregar"
                            : `${isEdit ? "Guardar" : "Agregar"} · $${formatMoney(picker.unitTotal)}`}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};
