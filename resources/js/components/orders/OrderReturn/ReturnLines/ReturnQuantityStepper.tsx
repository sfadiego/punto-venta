import { Minus, Plus } from "lucide-react";

interface ReturnQuantityStepperProps {
    quantity: number;
    max: number;
    onChange: (quantity: number) => void;
}

// Cantidad de piezas a devolver de una línea por unidad: de 1 al máximo devolvible, sin teclear.
export const ReturnQuantityStepper = ({ quantity, max, onChange }: ReturnQuantityStepperProps) => (
    <div className="flex shrink-0 items-center rounded-xl border border-stone-200">
        <button
            type="button"
            aria-label="Menos"
            disabled={quantity <= 1}
            onClick={() => onChange(quantity - 1)}
            className="flex h-8 w-8 items-center justify-center text-stone-600 transition-colors hover:text-stone-900 disabled:text-stone-300"
        >
            <Minus size={14} />
        </button>
        <span className="min-w-6 text-center text-sm font-semibold tabular-nums text-stone-800">{quantity}</span>
        <button
            type="button"
            aria-label="Más"
            disabled={quantity >= max}
            onClick={() => onChange(quantity + 1)}
            className="flex h-8 w-8 items-center justify-center text-stone-600 transition-colors hover:text-stone-900 disabled:text-stone-300"
        >
            <Plus size={14} />
        </button>
    </div>
);
