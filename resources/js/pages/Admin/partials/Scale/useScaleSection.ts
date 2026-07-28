import { useState } from "react";
import { toast } from "react-toastify";
import { useScale, ScalePairingCancelledError } from "@/contexts/ScaleContext";
import { logUnexpectedError } from "@/plugins/logger.plugin";

export const useScaleSection = () => {
    const { isSupported, isConnected, isPaired, pair, forget } = useScale();
    const [isPairing, setIsPairing] = useState(false);

    const handlePair = async () => {
        setIsPairing(true);
        try {
            await pair();
            toast.success("Báscula conectada");
        } catch (error) {
            // Cancelar el selector de puertos (o no tener báscula conectada en ese
            // momento) es una acción normal del usuario, no un error de la app.
            if (!(error instanceof ScalePairingCancelledError)) {
                logUnexpectedError(error, "useScaleSection.handlePair");
            }
            const msg = error instanceof Error ? error.message : "No se pudo conectar la báscula";
            toast.error(msg);
        } finally {
            setIsPairing(false);
        }
    };

    const handleForget = async () => {
        await forget();
        toast.info("Báscula desvinculada");
    };

    return { isSupported, isConnected, isPaired, isPairing, handlePair, handleForget };
};
