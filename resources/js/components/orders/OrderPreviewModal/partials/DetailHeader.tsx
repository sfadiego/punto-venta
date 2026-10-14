import { X } from "lucide-react";

interface DetailHeaderProps {
    nombrePedido: string;
    onClose: () => void;
}

export const DetailHeader = ({ nombrePedido, onClose }: DetailHeaderProps) => (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[var(--color-primary)] text-[var(--color-font)] shrink-0">
        <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">{nombrePedido}</p>
            <p className="text-xs opacity-70 leading-tight mt-0.5">Detalle de orden</p>
        </div>
        <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1 rounded opacity-70 hover:opacity-100 hover:bg-black/10 transition-colors"
        >
            <X size={18} />
        </button>
    </div>
);
