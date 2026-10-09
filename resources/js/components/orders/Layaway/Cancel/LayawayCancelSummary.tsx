import { formatCurrency } from "@/utils/formatCurrency";

interface LayawayCancelSummaryProps {
    paid: number;
    refund: number;
    retained: number;
}

export const LayawayCancelSummary = ({ paid, refund, retained }: LayawayCancelSummaryProps) => (
    <div className="rounded-xl bg-stone-50 border border-stone-200 p-3.5 space-y-2 text-sm">
        <div className="flex items-center justify-between">
            <span className="text-stone-500">Abonado por el cliente</span>
            <span className="font-semibold text-stone-800 tabular-nums">{formatCurrency(paid)}</span>
        </div>
        <div className="flex items-center justify-between">
            <span className="text-stone-500">Se reembolsa</span>
            <span className="font-semibold text-red-500 tabular-nums">{formatCurrency(refund)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-dashed border-stone-300 pt-2">
            <span className="text-stone-500">Retiene el negocio</span>
            <span className="font-bold text-amber-600 tabular-nums">{formatCurrency(retained)}</span>
        </div>
    </div>
);
