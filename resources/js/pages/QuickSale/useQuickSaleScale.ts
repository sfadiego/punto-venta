import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { useScale, ScaleNotConnectedError, ScalePairingCancelledError } from "@/contexts/ScaleContext";
import { logUnexpectedError } from "@/plugins/logger.plugin";

const WARNING_TIMEOUT_MS = 4000;

// Báscula real (ScaleContext / Web Serial) — lectura bajo demanda, sin polling: el hardware
// no soporta un stream continuo, y este es el único patrón probado contra la báscula física
// en el proyecto.
//
// Enlazar (handlePairScale) y leer para agregar al carrito (readScaleForCart) son acciones
// separadas: ScaleReadout solo enlaza, y tocar una card de producto por peso dispara la
// lectura en vivo — sin paso intermedio de "peso en espera".
export const useQuickSaleScale = () => {
    const { readWeightKg, pair: pairScale, isSupported: scaleSupported, isPaired: scaleIsPaired } = useScale();
    const [isPairing, setIsPairing] = useState(false);
    const [isReadingScale, setIsReadingScale] = useState(false);
    const [scaleWarning, setScaleWarning] = useState<string | null>(null);
    const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isReadingRef = useRef(false);

    const setWarning = (message: string | null) => {
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        setScaleWarning(message);
        if (message) {
            warningTimeoutRef.current = setTimeout(() => setScaleWarning(null), WARNING_TIMEOUT_MS);
        }
    };

    const handlePairScale = async () => {
        if (!scaleSupported) {
            toast.error("Báscula no disponible en este navegador (usa Chrome o Edge de escritorio)");
            return;
        }
        setIsPairing(true);
        try {
            await pairScale();
        } catch (error) {
            // Cancelar el selector de puertos es una acción normal del usuario, no un error.
            if (error instanceof ScalePairingCancelledError) return;
            logUnexpectedError(error, "useQuickSaleScale.handlePairScale");
            toast.error(error instanceof Error ? error.message : "No se pudo enlazar la báscula");
        } finally {
            setIsPairing(false);
        }
    };

    // Lectura en vivo disparada al tocar una card de producto por peso (solo si la báscula ya
    // está enlazada — ver useQuickSalePage.handleCardTap). Retorna el peso en kg, o null si no
    // se pudo leer (báscula en 0, error, o ya había una lectura en curso).
    const readScaleForCart = async (): Promise<number | null> => {
        if (isReadingRef.current) return null;
        isReadingRef.current = true;
        setIsReadingScale(true);
        setWarning(null);
        try {
            let weightKg: number;
            try {
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
                setWarning("La báscula marca 0 — coloca el producto y vuelve a leer");
                return null;
            }
            return weightKg;
        } catch (error) {
            if (error instanceof ScalePairingCancelledError) return null;
            logUnexpectedError(error, "useQuickSaleScale.readScaleForCart");
            toast.error(error instanceof Error ? error.message : "No se pudo leer la báscula");
            return null;
        } finally {
            isReadingRef.current = false;
            setIsReadingScale(false);
        }
    };

    return {
        scaleSupported,
        scaleIsPaired,
        isPairing,
        isReadingScale,
        scaleWarning,
        handlePairScale,
        readScaleForCart,
    };
};
