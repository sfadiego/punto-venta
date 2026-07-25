import { Loader, CheckCircle2 } from "lucide-react";

interface MarkServedActionProps {
    isServed: boolean;
    allReady: boolean;
    isUpdatingStatus: boolean;
    isEmpty: boolean;
    readyCount: number;
    totalCount: number;
    onMarkServed: () => void;
}

export const MarkServedAction = ({
    isServed,
    allReady,
    isUpdatingStatus,
    isEmpty,
    readyCount,
    totalCount,
    onMarkServed,
}: MarkServedActionProps) => (
    <div className="px-5 py-3 border-b border-stone-100 shrink-0">
        <button
            onClick={onMarkServed}
            disabled={isServed || !allReady || isUpdatingStatus || isEmpty}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isServed
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                    : allReady
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                      : "bg-stone-100 text-stone-400 cursor-not-allowed"
            }`}
        >
            {isUpdatingStatus ? (
                <Loader size={15} className="animate-spin" />
            ) : (
                <CheckCircle2 size={15} />
            )}
            {isServed
                ? "Orden servida ✓"
                : allReady
                  ? "Marcar orden como servida"
                  : `${readyCount}/${totalCount} listos`}
        </button>
    </div>
);
