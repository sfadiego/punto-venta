import { AlertCircle } from "lucide-react";
import { ILayawayListSummary } from "@/models/ILayaway";
import { formatCurrency } from "@/utils/formatCurrency";

interface LayawayOverdueNoticeProps {
    summary: ILayawayListSummary;
    onView: () => void;
}

// Aviso de una línea que solo aparece cuando hay apartados vencidos; con todo al corriente no ocupa espacio.
export const LayawayOverdueNotice = ({ summary, onView }: LayawayOverdueNoticeProps) => (
    <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 mb-4">
        <AlertCircle size={16} className="shrink-0" />
        <span className="font-medium">
            {summary.overdue_count} {summary.overdue_count === 1 ? "apartado vencido" : "apartados vencidos"}
        </span>
        <span className="text-red-600/80">Saldo por cobrar en apartados: {formatCurrency(summary.pending_balance)}</span>
        <button type="button" onClick={onView} className="ml-auto font-semibold underline underline-offset-2 hover:text-red-800">
            Ver apartados
        </button>
    </div>
);
