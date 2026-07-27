import { useState } from "react";
import { toast } from "react-toastify";
import { useScale } from "@/contexts/ScaleContext";
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
            logUnexpectedError(error, "useScaleSection.handlePair");
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
