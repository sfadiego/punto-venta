import { Weight, Loader } from "lucide-react";

interface ScaleReadoutProps {
    isSupported: boolean;
    isPaired: boolean;
    isBusy: boolean;
    warningMessage: string | null;
    onPair: () => void;
}

const getStatusLabel = (isSupported: boolean, isBusy: boolean, isPaired: boolean): string => {
    if (!isSupported) return "No disponible";
    if (isBusy) return "Leyendo…";
    if (isPaired) return "Báscula conectada";
    return "Toca para conectar";
};

// Solo controla el enlace de la báscula (pairing) — la lectura para agregar al carrito ocurre
// al tocar directamente una card de producto por peso (ver useQuickSalePage.handleCardTap).
// Una vez enlazada, tocar este control ya no hace nada: reconectar/olvidar vive en
// Configuración > Báscula.
export const ScaleReadout = ({ isSupported, isPaired, isBusy, warningMessage, onPair }: ScaleReadoutProps) => {
    const statusLabel = getStatusLabel(isSupported, isBusy, isPaired);

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
                <span
                    className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${
                        isPaired ? "text-emerald-600" : "text-stone-400"
                    }`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${isPaired ? "bg-emerald-500" : "bg-stone-300"}`} />
                    {statusLabel}
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
