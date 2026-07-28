import { X } from "lucide-react";

interface ClearFiltersButtonProps {
    onClick: () => void;
}

export const ClearFiltersButton = ({ onClick }: ClearFiltersButtonProps) => (
    <button
        onClick={onClick}
        className="h-9 flex items-center gap-1.5 px-3 rounded-xl border
            border-stone-200 bg-stone-50 text-xs font-medium text-stone-400
            hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all self-end"
    >
        <X size={13} />
        Limpiar
    </button>
);
