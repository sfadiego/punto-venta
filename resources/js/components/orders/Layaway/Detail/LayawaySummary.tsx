import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateLabel } from "@/utils/dateUtils";

interface LayawaySummaryProps {
    total: number;
    deposit: number;
    balance: number;
    dueDate: string;
}

export const LayawaySummary = ({ total, deposit, balance, dueDate }: LayawaySummaryProps) => (
    <div className="rounded-xl bg-stone-50 border border-stone-200 p-3.5 space-y-2 text-sm">
        <div className="flex items-center justify-between">
            <span className="text-stone-500">Total de la venta</span>
            <span className="font-semibold text-stone-800 tabular-nums">{formatCurrency(total)}</span>
        </div>
        <div className="flex items-center justify-between">
            <span className="text-stone-500">Anticipo hoy</span>
            <span className="font-semibold text-emerald-700 tabular-nums">{formatCurrency(deposit)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-dashed border-stone-300 pt-2">
            <span className="text-stone-500">Saldo pendiente</span>
            <span className="font-bold text-stone-900 tabular-nums">{formatCurrency(balance)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400">Fecha límite</span>
            <span className="text-stone-600">{formatDateLabel(dueDate)}</span>
        </div>
    </div>
);
