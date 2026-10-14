import { Loader, Check } from "lucide-react";

interface ReadyToggleButtonProps {
    isReady: boolean;
    isPartial?: boolean;
    isPending: boolean;
    title: string;
    onClick: () => void;
}

/** Check circular de "listo" — comparte estilo entre la fila de grupo y las líneas expandidas. */
export const ReadyToggleButton = ({ isReady, isPartial = false, isPending, title, onClick }: ReadyToggleButtonProps) => (
    <button
        onClick={onClick}
        disabled={isPending}
        title={title}
        aria-pressed={isReady}
        className="shrink-0 self-center p-0.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {isPending ? (
            <Loader size={16} className="animate-spin text-stone-400" />
        ) : (
            <span
                className={`grid place-items-center w-4 h-4 rounded-full border-[1.5px] transition-colors ${
                    isReady
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : isPartial
                          ? "border-emerald-400 bg-emerald-100 text-emerald-600"
                          : "border-stone-400 text-transparent hover:border-emerald-500"
                }`}
            >
                <Check size={10} strokeWidth={3} />
            </span>
        )}
    </button>
);
