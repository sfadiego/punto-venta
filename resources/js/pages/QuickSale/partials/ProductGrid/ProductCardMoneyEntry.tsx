import { Input } from "@/components/ui/form/Input";
import { sanitizePositiveNumberInput } from "@/utils/sanitizePositiveNumberInput";

interface ProductCardMoneyEntryProps {
    value: string;
    onChange: (value: string) => void;
    onCommit: () => void;
    maxValue: number;
}

export const ProductCardMoneyEntry = ({ value, onChange, onCommit, maxValue }: ProductCardMoneyEntryProps) => {
    const numValue = parseFloat(value) || 0;
    const isOverLimit = numValue > maxValue;
    const canCommit = numValue > 0 && !isOverLimit;

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className={`flex items-center gap-1.5 rounded-xl pl-3 pr-1.5 py-1 border transition-colors ${
                isOverLimit ? "bg-red-50 border-red-300" : "bg-amber-50 border-amber-200"
            }`}
        >
            <span className={`text-sm font-bold ${isOverLimit ? "text-red-400" : "text-stone-400"}`}>$</span>
            <Input
                name="monto"
                inputType="number"
                placeholder="0"
                min={0}
                max={maxValue}
                value={value}
                onChange={(e) => onChange(sanitizePositiveNumberInput(e.target.value))}
                onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "Minus") {
                        e.preventDefault();
                        return;
                    }
                    if (e.key === "Enter" && canCommit) {
                        e.preventDefault();
                        onCommit();
                    }
                }}
                inputStyle="none"
                className={`!w-20 !px-0 !py-1.5 !border-0 !rounded-none !bg-transparent !text-base !font-bold focus:!ring-0 tabular-nums ${
                    isOverLimit ? "!text-red-600" : "!text-stone-900"
                }`}
            />
            <button
                type="button"
                onClick={onCommit}
                disabled={!canCommit}
                className="shrink-0 text-xs font-bold px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white active:scale-95 transition-colors"
            >
                Agregar
            </button>
        </div>
    );
};
