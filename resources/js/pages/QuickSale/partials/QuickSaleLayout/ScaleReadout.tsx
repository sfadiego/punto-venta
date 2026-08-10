import { Weight, Loader, X } from "lucide-react";

interface ScaleReadoutProps {
    isSupported: boolean;
    isPaired: boolean;
    isReading: boolean;
    stagedWeightKg: number | null;
    onRead: () => void;
    onClearStaged: () => void;
}

export const ScaleReadout = ({
    isSupported,
    isPaired,
    isReading,
    stagedWeightKg,
    onRead,
    onClearStaged,
}: ScaleReadoutProps) => {
    const staged = stagedWeightKg !== null;
    const grams = staged ? Math.round(stagedWeightKg * 1000) : 0;

    const statusLabel = !isSupported
        ? "No disponible"
        : isReading
          ? "Leyendo…"
          : staged
            ? "Lista"
            : isPaired
              ? "Báscula"
              : "Toca para conectar";

    return (
        <div
            className={`flex items-center gap-3 rounded-xl border pl-4 pr-2 py-1.5 transition-colors ${
                staged ? "bg-amber-50 border-amber-300" : "bg-stone-50 border-stone-200"
            } ${!isSupported ? "opacity-60" : ""}`}
        >
            <button
                type="button"
                onClick={onRead}
                disabled={!isSupported || isReading}
                title={isSupported ? "Leer báscula" : "Requiere Chrome o Edge de escritorio"}
                className="flex items-center gap-2 disabled:cursor-not-allowed"
            >
                {isReading ? (
                    <Loader size={20} className="animate-spin text-stone-400" />
                ) : (
                    <Weight size={20} className={staged ? "text-amber-600" : "text-stone-400"} />
                )}
                <span className="flex flex-col gap-0.5 leading-none text-left">
                    <span
                        className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${
                            staged ? "text-amber-600" : "text-stone-400"
                        }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${isPaired ? "bg-emerald-500" : "bg-stone-300"}`} />
                        {statusLabel}
                    </span>
                    <span
                        className={`text-2xl font-extrabold leading-none tabular-nums ${
                            staged ? "text-amber-600" : "text-stone-900"
                        }`}
                    >
                        {grams}
                        <span className="ml-0.5 text-sm font-bold text-stone-400">g</span>
                    </span>
                </span>
            </button>

            {staged && (
                <button
                    type="button"
                    onClick={onClearStaged}
                    aria-label="Descartar lectura"
                    title="Descartar lectura"
                    className="shrink-0 p-1.5 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-100 transition-colors"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
};
