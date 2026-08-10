import { WeightChipOption } from "@/utils/weightUnits";

interface ProductCardChipsProps {
    options: WeightChipOption[];
    onAdd: (value: number) => void;
    disabled?: boolean;
    // Chips cuyo valor supere lo disponible se deshabilitan individualmente — ej. con 0.3 kg
    // restantes, "250 g" sigue siendo válido pero "500 g"/"1 kg" no.
    maxAddable?: number;
}

export const ProductCardChips = ({ options, onAdd, disabled = false, maxAddable }: ProductCardChipsProps) => (
    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
        {options.map((option) => {
            const exceedsStock = maxAddable !== undefined && option.value > maxAddable;
            return (
                <button
                    key={option.label}
                    type="button"
                    disabled={disabled || exceedsStock}
                    onClick={() => onAdd(option.value)}
                    className="flex-1 text-center text-xs font-semibold py-2 rounded-lg border border-stone-200 bg-stone-50 text-stone-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-stone-200 disabled:hover:bg-stone-50 disabled:active:scale-100"
                >
                    {option.label}
                </button>
            );
        })}
    </div>
);
