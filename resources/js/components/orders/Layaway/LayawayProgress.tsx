import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { calcLayawayBalance, calcLayawayProgress } from "@/utils/layawayCalc";

interface LayawayProgressProps {
    total: number;
    paid: number;
    showAmounts?: boolean;
}

export const LayawayProgress = ({ total, paid, showAmounts = false }: LayawayProgressProps) => (
    <div className="min-w-[120px]">
        {showAmounts && (
            <div className="flex justify-between text-xs text-stone-500 mb-1">
                <span>Abonado {formatCurrencyTrimmed(paid)}</span>
                <span>Total {formatCurrencyTrimmed(total)}</span>
            </div>
        )}
        <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
            <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                role="progressbar"
                aria-valuenow={calcLayawayProgress(total, paid)}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{ width: `${calcLayawayProgress(total, paid)}%` }}
            />
        </div>
        <p className="text-xs text-stone-400 mt-1">
            {showAmounts ? "Saldo pendiente " : "Resta "}
            <span className="font-medium text-stone-600">{formatCurrencyTrimmed(calcLayawayBalance(total, paid))}</span>
        </p>
    </div>
);
