import { Banknote, X } from "lucide-react";

interface PayModalHeaderProps {
    onClose: () => void;
}

export const PayModalHeader = ({ onClose }: PayModalHeaderProps) => (
    <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Banknote size={16} className="text-emerald-600" />
            </div>
            <h2 className="font-semibold text-stone-900 text-sm">Cobro de orden</h2>
        </div>
        <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
        >
            <X size={16} />
        </button>
    </div>
);
