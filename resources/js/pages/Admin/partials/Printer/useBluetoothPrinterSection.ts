import { useState } from "react";
import { toast } from "react-toastify";
import { useBluetoothPrint } from "@/hooks/useBluetoothPrint";
import { useFetchPrintTestBytes } from "@/services/useOrderService";
import { reportClientError } from "@/utils/reportClientError";
import { logUnexpectedError } from "@/plugins/logger.plugin";

export const useBluetoothPrinterSection = () => {
    const { isSupported, isConnected, isPaired, deviceName, pair, forget, print } = useBluetoothPrint();
    const fetchPrintTestBytes = useFetchPrintTestBytes();
    const [isPairing, setIsPairing] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    const handlePair = async () => {
        setIsPairing(true);
        try {
            await pair();
            toast.success("Impresora Bluetooth emparejada");
        } catch (error) {
            logUnexpectedError(error, "useBluetoothPrinterSection.handlePair");
            const msg = error instanceof Error ? error.message : "No se pudo emparejar la impresora";
            toast.error(msg);
        } finally {
            setIsPairing(false);
        }
    };

    const handleForget = () => {
        forget();
        toast.info("Impresora Bluetooth desvinculada");
    };

    const handleTestPrint = async () => {
        setIsTesting(true);
        try {
            const bytes = await fetchPrintTestBytes();
            await print(new Uint8Array(bytes as ArrayBuffer));
            toast.success("Impresión de prueba enviada");
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Error al imprimir";
            const stack = error instanceof Error ? error.stack : undefined;
            toast.error(`Error: ${msg}`);
            reportClientError({ message: msg, stack, context: "print-bluetooth-test" });
        } finally {
            setIsTesting(false);
        }
    };

    return {
        isSupported,
        isConnected,
        isPaired,
        deviceName,
        isPairing,
        isTesting,
        handlePair,
        handleForget,
        handleTestPrint,
    };
};
