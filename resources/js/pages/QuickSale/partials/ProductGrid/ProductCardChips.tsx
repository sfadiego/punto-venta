interface WeightOption {
    kg: number;
    label: string;
}

const WEIGHT_OPTIONS: WeightOption[] = [
    { kg: 0.25, label: "250 g" },
    { kg: 0.5, label: "500 g" },
    { kg: 1, label: "1 kg" },
];

interface ProductCardChipsProps {
    onAdd: (kg: number) => void;
}

export const ProductCardChips = ({ onAdd }: ProductCardChipsProps) => (
    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
        {WEIGHT_OPTIONS.map((option) => (
            <button
                key={option.label}
                type="button"
                onClick={() => onAdd(option.kg)}
                className="flex-1 text-center text-xs font-semibold py-2 rounded-lg border border-stone-200 bg-stone-50 text-stone-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 active:scale-95 transition-all"
            >
                {option.label}
            </button>
        ))}
    </div>
);
