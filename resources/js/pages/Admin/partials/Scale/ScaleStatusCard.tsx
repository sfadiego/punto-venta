import { Scale } from "lucide-react";
import { ScaleActions } from "./ScaleActions";

interface ScaleStatusCardProps {
    isConnected: boolean;
    isPaired: boolean;
    isPairing: boolean;
    onPair: () => void;
    onForget: () => void;
}

export const ScaleStatusCard = ({ isConnected, isPaired, isPairing, onPair, onForget }: ScaleStatusCardProps) => (
    <div
        className={`flex items-center gap-3 p-4 rounded-xl border ${
            isConnected ? "bg-emerald-50 border-emerald-100" : "bg-stone-50 border-stone-200"
        }`}
    >
        <Scale size={20} className={isConnected ? "text-emerald-500 shrink-0" : "text-stone-400 shrink-0"} />
        <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${isConnected ? "text-emerald-700" : "text-stone-500"}`}>
                {isConnected
                    ? "Conectada"
                    : isPaired
                        ? "Emparejada, sin conexión activa"
                        : "Sin báscula conectada"}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
                {isConnected
                    ? "Lista para leer el peso al cobrar."
                    : isPaired
                        ? "Vuelve a abrir la app o revisa que la báscula esté encendida."
                        : "Enciende la báscula y presiona \"Conectar báscula\"."}
            </p>
        </div>

        <ScaleActions isPaired={isPaired} isPairing={isPairing} onPair={onPair} onForget={onForget} />
    </div>
);
