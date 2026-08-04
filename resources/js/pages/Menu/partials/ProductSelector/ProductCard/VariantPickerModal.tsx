import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IMenuProduct } from "@/models/IMenu";
import { IProductVariant } from "@/models/IProductVariant";
import { formatMoney } from "@/utils/formatCurrency";

interface VariantPickerModalProps {
    isOpen: boolean;
    product: IMenuProduct;
    primaryColor: string;
    onSelect: (variant: IProductVariant) => void;
    onClose: () => void;
}

export const VariantPickerModal = ({ isOpen, product, primaryColor, onSelect, onClose }: VariantPickerModalProps) => {
    if (!isOpen) return null;

    const variants = (product.variants ?? []).filter((v) => v.activo);

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xs overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-stone-100">
                    <h2 className="font-semibold text-stone-900 text-sm">{product.nombre}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-400"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-3 space-y-2 pb-6">
                    {variants.map((variant) => (
                        <button
                            key={variant.id}
                            onClick={() => onSelect(variant)}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-stone-200 active:bg-stone-50 transition-colors text-left"
                        >
                            <span className="text-sm font-medium text-stone-800">{variant.nombre}</span>
                            <span className="text-sm font-bold tabular-nums" style={{ color: primaryColor }}>
                                ${formatMoney(variant.precio)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
};
