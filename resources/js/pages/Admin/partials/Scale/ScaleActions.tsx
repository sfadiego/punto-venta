import { Loader, Scale, Unlink } from "lucide-react";

interface ScaleActionsProps {
    isPaired: boolean;
    isPairing: boolean;
    onPair: () => void;
    onForget: () => void;
}

export const ScaleActions = ({ isPaired, isPairing, onPair, onForget }: ScaleActionsProps) => (
    <div className="flex items-center gap-2 shrink-0">
        {isPaired ? (
            <button
                onClick={onForget}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200
                    bg-white text-stone-500 text-xs font-medium hover:bg-stone-50 transition-colors"
            >
                <Unlink size={13} />
                Olvidar
            </button>
        ) : (
            <button
                onClick={onPair}
                disabled={isPairing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200
                    bg-white text-stone-700 text-xs font-medium hover:bg-stone-50
                    disabled:opacity-50 transition-colors"
            >
                {isPairing ? <Loader size={13} className="animate-spin" /> : <Scale size={13} />}
                Conectar báscula
            </button>
        )}
    </div>
);
