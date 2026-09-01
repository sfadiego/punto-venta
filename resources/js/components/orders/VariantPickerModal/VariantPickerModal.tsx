import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IProductVariant } from "@/models/IProductVariant";
import { formatMoney } from "@/utils/formatCurrency";

export interface VariantOption {
    variant: IProductVariant;
    remaining: number; // Infinity si el producto no maneja stock
    exhausted: boolean;
}

interface VariantPickerModalProps {
    isOpen: boolean;
    title: string;
    options: VariantOption[];
    onSelect: (variant: IProductVariant) => void;
    onClose: () => void;
}

// Compartido entre Orders (TakeOrder), QuickSale y el Menú público — cada página calcula
// `remaining`/`exhausted` con su propia fuente de carrito (ver useProductCard/useVariantPicker
// de cada una) y este componente solo pinta la lista, sin conocer IProduct/IMenuProduct.
// Portal + hoja inferior en mobile para que el modal nunca quede recortado por un ancestro con
// overflow, sin importar en qué parte del árbol se monte.
export const VariantPickerModal = ({ isOpen, title, options, onSelect, onClose }: VariantPickerModalProps) => {
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
                    {options.map(({ variant, remaining, exhausted }) => (
                        <button
                            key={variant.id}
                            type="button"
                            disabled={exhausted}
                            onClick={() => onSelect(variant)}
                            className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors ${
                                exhausted ? "opacity-50 cursor-not-allowed" : "hover:bg-amber-50"
                            }`}
                        >
                            <span className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 ${exhausted ? "border-stone-200" : "border-stone-300"}`} />
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
                        </button>
                    ))}
                </div>
            </div>
        </div>,
        document.body,
    );
};
