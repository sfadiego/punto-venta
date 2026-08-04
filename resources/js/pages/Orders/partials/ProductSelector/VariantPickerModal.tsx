import { X } from "lucide-react";
import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";

interface VariantPickerModalProps {
    isOpen: boolean;
    product: IProduct;
    onSelect: (variant: IProductVariant) => void;
    onClose: () => void;
}

export const VariantPickerModal = ({ isOpen, product, onSelect, onClose }: VariantPickerModalProps) => {
    if (!isOpen) return null;

    const variants = (product.variants ?? []).filter((v) => v.activo);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xs overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-stone-100">
                    <h2 className="font-semibold text-stone-900 text-sm">{product.nombre}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-3 space-y-2">
                    {variants.map((variant) => (
                        <button
                            key={variant.id}
                            onClick={() => onSelect(variant)}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-stone-200 hover:border-amber-300 hover:bg-amber-50 transition-colors text-left"
                        >
                            <span className="text-sm font-medium text-stone-800">{variant.nombre}</span>
                            <span className="text-sm font-bold text-amber-600">${variant.precio}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
