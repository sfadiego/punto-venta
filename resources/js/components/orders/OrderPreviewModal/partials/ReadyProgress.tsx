import { Check, Loader } from "lucide-react";

interface ReadyProgressProps {
    readyCount: number;
    totalCount: number;
    allReady: boolean;
    isToggling: boolean;
    disabled: boolean;
    onToggleAll: () => void;
}

export const ReadyProgress = ({ readyCount, totalCount, allReady, isToggling, disabled, onToggleAll }: ReadyProgressProps) => {
    const percent = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

    return (
        <div className="flex items-center gap-2.5 px-4 py-2 border-b border-stone-100 bg-stone-50 shrink-0 flex-wrap">
            <div className="flex-1 min-w-[60px] h-[3px] bg-stone-200 overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-xs font-mono tabular-nums text-stone-900">
                {readyCount}/{totalCount} listos
            </span>
            <button
                type="button"
                onClick={onToggleAll}
                disabled={disabled || isToggling || totalCount === 0}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-900 bg-white border border-stone-200 rounded-[3px] px-2 py-[3px] hover:bg-stone-50 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isToggling ? <Loader size={11} className="animate-spin" /> : <Check size={11} className="text-emerald-600" />}
                {allReady ? "Desmarcar todo" : "Marcar todo listo"}
            </button>
        </div>
    );
};
