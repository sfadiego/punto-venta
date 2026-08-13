import { Weight, Loader } from "lucide-react";
import { getScaleStatusLabel } from "@/utils/scaleStatus";

interface ScaleReadoutProps {
    isSupported: boolean;
    isPaired: boolean;
    isBusy: boolean;
    warningMessage: string | null;
    lastReadWeightKg: number | null;
    onPair: () => void;
}

// Solo controla el enlace de la báscula (pairing) — la lectura para agregar al carrito ocurre
// al tocar directamente una card de producto por peso (ver useQuickSalePage.handleCardTap).
// Una vez enlazada, tocar este control ya no hace nada: reconectar/olvidar vive en
// Configuración > Báscula.
export const ScaleReadout = ({ isSupported, isPaired, isBusy, warningMessage, lastReadWeightKg, onPair }: ScaleReadoutProps) => {
    const statusLabel = getScaleStatusLabel(isSupported, isBusy, isPaired);
    const grams = lastReadWeightKg !== null ? Math.round(lastReadWeightKg * 1000) : null;

    return (
        <div className="flex flex-col gap-1 items-end">
            <button
                type="button"
                onClick={onPair}
                disabled={!isSupported || isBusy || isPaired}
                title={
                    !isSupported
                        ? "Requiere Chrome o Edge de escritorio"
                        : isPaired
                          ? "Báscula ya conectada"
                          : "Enlazar báscula"
                }
                className="flex items-center gap-2 rounded-xl border bg-stone-50 border-stone-200 pl-3 pr-3 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-100"
            >
                {isBusy ? (
                    <Loader size={18} className="animate-spin text-stone-400" />
                ) : (
                    <Weight size={18} className={isPaired ? "text-emerald-600" : "text-stone-400"} />
                )}
                <span className="flex flex-col leading-none text-left">
                    <span
                        className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${
                            isPaired ? "text-emerald-600" : "text-stone-400"
                        }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${isPaired ? "bg-emerald-500" : "bg-stone-300"}`} />
                        {statusLabel}
                    </span>
                    {/* Confirmación visual del último peso agregado al carrito — se actualiza en
                        cada tap de producto (readScaleForCart), no es un valor "en espera". */}
                    {grams !== null && (
                        <span className="mt-0.5 text-sm font-extrabold tabular-nums text-stone-900">
                            {grams}
                            <span className="ml-0.5 text-[10px] font-bold text-stone-400">g</span>
                        </span>
                    )}
                </span>
            </button>

            {warningMessage && (
                <p className="text-[11px] font-medium text-red-500 text-right max-w-[220px] leading-tight">
                    {warningMessage}
                </p>
            )}
        </div>
    );
};
