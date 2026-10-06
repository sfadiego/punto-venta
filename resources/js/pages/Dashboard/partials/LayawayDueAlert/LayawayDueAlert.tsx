import { AlertTriangle, ChevronRight } from "lucide-react";
import { useLayawayDueAlert } from "./useLayawayDueAlert";

const pluralize = (count: number, singular: string, plural: string): string =>
    `${count} ${count === 1 ? singular : plural}`;

export const LayawayDueAlert = () => {
    const { overdueCount, dueSoonCount, goToLayaways } = useLayawayDueAlert();

    if (overdueCount === 0 && dueSoonCount === 0) return null;

    const hasOverdue = overdueCount > 0;
    const parts = [
        hasOverdue ? pluralize(overdueCount, "apartado vencido", "apartados vencidos") : null,
        dueSoonCount > 0 ? pluralize(dueSoonCount, "por vencer esta semana", "por vencer esta semana") : null,
    ].filter(Boolean);

    return (
        <button
            type="button"
            onClick={goToLayaways}
            className={`w-full flex items-center gap-3 text-left rounded-2xl border px-4 py-3 mb-4 transition-colors ${
                hasOverdue
                    ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                    : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
            }`}
        >
            <AlertTriangle size={18} className="shrink-0" />
            <span className="flex-1 min-w-0 text-sm font-medium">{parts.join(" · ")}</span>
            <span className="hidden sm:inline text-xs font-semibold">Ver apartados</span>
            <ChevronRight size={16} className="shrink-0" />
        </button>
    );
};
