import { useState } from "react";
import { toast } from "react-toastify";
import { useScale, ScaleNotConnectedError, ScalePairingCancelledError } from "@/contexts/ScaleContext";
import { logUnexpectedError } from "@/plugins/logger.plugin";

// Báscula real (ScaleContext / Web Serial) — lectura bajo demanda, sin polling: el hardware
// no soporta un stream continuo, y este es el único patrón probado contra la báscula física
// en el proyecto (mismo flujo que useSellByWeightSaleModal.handleScaleReading).
export const useQuickSaleScale = () => {
    const { readWeightKg, pair: pairScale, isSupported: scaleSupported, isPaired: scaleIsPaired } = useScale();
    const [isReadingScale, setIsReadingScale] = useState(false);
    const [stagedWeightKg, setStagedWeightKg] = useState<number | null>(null);

    const handleReadScale = async () => {
        if (!scaleSupported) {
            toast.error("Báscula no disponible en este navegador (usa Chrome o Edge de escritorio)");
            return;
        }
        setIsReadingScale(true);
        try {
            let weightKg: number;
            try {
                // Si nunca se emparejó desde Configuración, se pide el puerto aquí mismo
                // (un solo toque) en vez de solo avisar que vaya a Configuración.
                if (!scaleIsPaired) await pairScale();
                weightKg = await readWeightKg();
            } catch (error) {
                // El flag local dice "emparejada" pero el navegador ya perdió el puerto
                // (ej. Firefox no persiste permisos de Web Serial entre refrescos) —
                // se reintenta pidiendo el puerto de nuevo.
                if (!(error instanceof ScaleNotConnectedError)) throw error;
                await pairScale();
                weightKg = await readWeightKg();
            }
            if (weightKg <= 0) {
                toast.error("La báscula marca 0 — coloca el producto y vuelve a leer");
                return;
            }
            setStagedWeightKg(weightKg);
            toast.info(`${Math.round(weightKg * 1000)} g listos — toca un producto para agregarlo`);
        } catch (error) {
            // Cancelar el selector de puertos es una acción normal del usuario, no un error.
            if (error instanceof ScalePairingCancelledError) return;
            logUnexpectedError(error, "useQuickSaleScale.handleReadScale");
            toast.error(error instanceof Error ? error.message : "No se pudo leer la báscula");
        } finally {
            setIsReadingScale(false);
        }
    };

    const clearStagedWeight = () => setStagedWeightKg(null);

    return { scaleSupported, scaleIsPaired, isReadingScale, stagedWeightKg, handleReadScale, clearStagedWeight };
};
