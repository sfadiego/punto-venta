import { Minus, Plus } from "lucide-react";

interface UnitControlsProps {
    quantity: number;
    primaryColor: string;
    onAdd: () => void;
    onRemove: () => void;
}

export const UnitControls = ({ quantity, primaryColor, onAdd, onRemove }: UnitControlsProps) => (
    <div className="flex items-center gap-1 shrink-0">
        <button
            onClick={onRemove}
            className="w-9 h-9 rounded-xl bg-stone-100 active:bg-stone-200 flex items-center justify-center transition-colors"
            aria-label="Quitar uno"
        >
            <Minus size={14} className="text-stone-600" />
        </button>
        <span className="text-sm font-semibold text-stone-800 w-5 text-center tabular-nums">
            {quantity}
        </span>
        <button
            onClick={onAdd}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-opacity active:opacity-70"
            style={{ backgroundColor: primaryColor }}
            aria-label="Agregar uno"
        >
            <Plus size={14} />
        </button>
    </div>
);
