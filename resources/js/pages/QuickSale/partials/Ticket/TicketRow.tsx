import { Trash2 } from "lucide-react";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";

interface TicketRowProps {
    name: string;
    quantityLabel: string;
    priceLabel: string;
    lineTotal: number;
    onRemove?: () => void;
    highlighted?: boolean;
}

export const TicketRow = ({ name, quantityLabel, priceLabel, lineTotal, onRemove, highlighted = false }: TicketRowProps) => (
    <div
        className={`flex items-center justify-between gap-3 py-2.5 px-2 -mx-2 rounded-lg border-b border-stone-100 last:border-b-0 transition-colors duration-500 ${
            highlighted ? "bg-amber-100" : "bg-transparent"
        }`}
    >
        <div className="flex items-center gap-2.5 min-w-0">
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Quitar ${name}`}
                    className="shrink-0 text-red-400 hover:text-red-600 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            )}
            <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900 truncate">{name}</p>
                <p className="text-xs text-stone-500 tabular-nums">
                    {quantityLabel} · {priceLabel}
                </p>
            </div>
        </div>
        <span className="shrink-0 text-sm font-semibold text-stone-900 tabular-nums">{formatCurrencyTrimmed(lineTotal)}</span>
    </div>
);
