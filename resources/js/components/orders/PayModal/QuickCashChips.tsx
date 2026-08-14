import { getQuickCashOptions } from "@/utils/quickCashDenominations";
import { formatCurrencyTrimmed as formatCurrency } from "@/utils/formatCurrency";

interface QuickCashChipsProps {
    totalFinal: number;
    cashNum: number;
    onSelect: (value: number) => void;
}

export const QuickCashChips = ({ totalFinal, cashNum, onSelect }: QuickCashChipsProps) => {
    const options = getQuickCashOptions(totalFinal);
    if (options.length === 0) return null;

    return (
        <div>
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5">
                Acceso rápido
            </p>
            <div className="flex gap-1.5">
                {options.map((option, idx) => {
                    const isSelected = cashNum === option.value;
                    return (
                        <button
                            key={`${option.value}-${idx}`}
                            type="button"
                            onClick={() => onSelect(option.value)}
                            className={`flex-1 min-w-0 flex flex-col items-center rounded-xl border px-1.5 py-2 text-center transition-colors ${
                                isSelected
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                    : option.isExact
                                        ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                        : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                            }`}
                        >
                            <span className="text-xs font-bold tabular-nums">{formatCurrency(option.value)}</span>
                            <span className="text-[10px] font-medium opacity-70">{option.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
