import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { IProductVariant } from "@/models/IProductVariant";
import { formatMoney } from "@/utils/formatCurrency";
import { UnitControls } from "@/components/ui/UnitControls";

export interface VariantOption {
    variant: IProductVariant;
    remaining: number; // Infinity si el producto no maneja stock
    exhausted: boolean;
    quantity: number; // cantidad de esta variante ya en el carrito
}

interface VariantPickerModalProps {
    isOpen: boolean;
    title: string;
    options: VariantOption[];
    onAdd: (variant: IProductVariant) => void;
    onRemove: (variant: IProductVariant) => void;
    onClose: () => void;
}

// Compartido entre Orders (TakeOrder), QuickSale y el Menú público — cada página calcula
// `remaining`/`exhausted`/`quantity` con su propia fuente de carrito (ver useProductCard/
// useVariantPicker de cada una) y este componente solo pinta la lista, sin conocer
// IProduct/IMenuProduct. El modal se queda abierto tras agregar/quitar — permite cargar más de
// una variante (o más de una unidad de la misma) antes de cerrarlo con la X o el fondo.
// Portal + hoja inferior en mobile para que el modal nunca quede recortado por un ancestro con
// overflow, sin importar en qué parte del árbol se monte.
export const VariantPickerModal = ({ isOpen, title, options, onAdd, onRemove, onClose }: VariantPickerModalProps) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xs overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-stone-100">
                    <h2 className="font-semibold text-stone-900 text-sm">{title}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="px-2 pt-1 pb-5 divide-y divide-stone-100 max-h-80 overflow-y-auto">
                    {options.map(({ variant, remaining, exhausted, quantity }) => (
                        <div key={variant.id} className="w-full flex items-center gap-3 px-3 py-3">
                            <span className="flex-1 min-w-0">
                                <span className="block text-sm font-medium text-stone-800 truncate">{variant.nombre}</span>
                                {remaining !== Infinity && (
                                    <span
                                        className={`block text-[11px] font-semibold ${
                                            exhausted ? "text-red-500 uppercase tracking-wide" : "text-stone-400"
                                        }`}
                                    >
                                        {exhausted ? "Sin existencia" : `Stock: ${remaining}`}
                                    </span>
                                )}
                            </span>
                            <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: "var(--color-primary)" }}>
                                ${formatMoney(variant.precio)}
                            </span>
                            {quantity === 0 ? (
                                <button
                                    type="button"
                                    disabled={exhausted}
                                    onClick={() => onAdd(variant)}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-opacity active:opacity-70 shrink-0 disabled:bg-stone-300 disabled:cursor-not-allowed disabled:active:opacity-100"
                                    style={exhausted ? undefined : { backgroundColor: "var(--color-primary)" }}
                                    aria-label={`Agregar ${variant.nombre}`}
                                >
                                    <Plus size={14} />
                                </button>
                            ) : (
                                <UnitControls
                                    quantity={quantity}
                                    primaryColor="var(--color-primary)"
                                    onAdd={() => onAdd(variant)}
                                    onRemove={() => onRemove(variant)}
                                    disableAdd={exhausted}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body,
    );
};
