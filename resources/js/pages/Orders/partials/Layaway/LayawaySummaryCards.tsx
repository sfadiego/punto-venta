import { ILayawayListSummary } from "@/models/ILayaway";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";

interface LayawaySummaryCardsProps {
    summary?: ILayawayListSummary;
}

export const LayawaySummaryCards = ({ summary }: LayawaySummaryCardsProps) => {
    const hasOverdue = (summary?.overdue_count ?? 0) > 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-4 py-3.5">
                <p className="text-xs text-stone-500">Apartados activos</p>
                <p className="text-2xl font-bold text-stone-900 mt-0.5">{summary?.active_count ?? 0}</p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-4 py-3.5">
                <p className="text-xs text-stone-500">Saldo por cobrar</p>
                <p className="text-2xl font-bold text-stone-900 mt-0.5 tabular-nums">
                    {formatCurrencyTrimmed(summary?.pending_balance ?? 0)}
                </p>
            </div>
            <div className={`rounded-2xl border shadow-sm px-4 py-3.5 bg-white ${hasOverdue ? "border-red-200" : "border-stone-100"}`}>
                <p className={`text-xs ${hasOverdue ? "text-red-600" : "text-stone-500"}`}>Vencidos</p>
                <p className={`text-2xl font-bold mt-0.5 ${hasOverdue ? "text-red-600" : "text-stone-900"}`}>
                    {summary?.overdue_count ?? 0}
                </p>
            </div>
        </div>
    );
};
