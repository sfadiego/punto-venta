import { X, Eye } from "lucide-react";

interface DetailHeaderProps {
    nombrePedido: string;
    onClose: () => void;
}

export const DetailHeader = ({ nombrePedido, onClose }: DetailHeaderProps) => (
    <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
        <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-100">
                <Eye size={20} className="text-orange-600" />
            </div>
            <div>
                <p className="text-sm font-semibold text-stone-900">{nombrePedido}</p>
                <p className="text-xs text-stone-400">Detalle de orden</p>
            </div>
        </div>
        <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
        >
            <X size={20} />
        </button>
    </div>
);
