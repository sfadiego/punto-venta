import { X, ShoppingCart } from "lucide-react";

interface NewSaleModalHeaderProps {
    isResuming: boolean;
    onClose: () => void;
}

export const NewSaleModalHeader = ({ isResuming, onClose }: NewSaleModalHeaderProps) => (
    <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
        <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100">
                <ShoppingCart size={16} className="text-amber-600" />
            </div>
            <h2 className="text-base font-semibold text-stone-900">
                {isResuming ? "Reanudar venta" : "Nueva venta"}
            </h2>
        </div>
        <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
        >
            <X size={18} />
        </button>
    </div>
);
