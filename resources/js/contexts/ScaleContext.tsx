import { createContext, useCallback, useContext, useRef, useState } from "react";
import { parseScaleWeightKg } from "@/utils/scaleProtocol";
import { logUnexpectedError } from "@/plugins/logger.plugin";

// Configuración confirmada para la báscula Torrey L-PCR — ver bascula-test/README.md.
const SERIAL_OPTIONS: SerialOptions = { baudRate: 9600, dataBits: 8, parity: "none", stopBits: 1 };
const READ_TIMEOUT_MS = 3000;
const STORAGE_KEY = "scale_pairing";

interface ScaleContextType {
    isSupported: boolean;
    isConnected: boolean;
    /** true una vez que el negocio conectó la báscula desde Configuración — controla si mostrar el botón "Leer báscula" en las ventas. */
    isPaired: boolean;
    /** Muestra el selector nativo de puertos serie — usar desde Configuración, acción explícita del usuario. */
    pair: () => Promise<void>;
    forget: () => Promise<void>;
    /** Manda "P", lee hasta el "\r" y devuelve el peso en kg. Reconecta en silencio si ya estaba autorizada. */
    readWeightKg: () => Promise<number>;
}

const notMounted = async (): Promise<never> => {
    throw new Error("ScaleProvider no montado");
};

/**
 * Se lanza específicamente cuando no hay un puerto ya autorizado (getPorts()
 * vacío) — distinto de un error de lectura con la báscula ya conectada. Sirve
 * para que quien llama pueda reintentar pidiendo el puerto de nuevo (ej. en
 * Firefox, que no persiste permisos de Web Serial entre refrescos: la app cree
 * que ya está emparejada mientras el navegador ya perdió el permiso real).
 */
export class ScaleNotConnectedError extends Error {}

export const ScaleContext = createContext<ScaleContextType>({
    isSupported: false,
    isConnected: false,
    isPaired: false,
    pair: notMounted,
    forget: notMounted,
    readWeightKg: notMounted,
});

export const useScale = () => useContext(ScaleContext);

interface ScaleProviderProps {
    children: React.ReactNode;
    enabled?: boolean;
}

const loadIsPaired = (): boolean => {
    try {
        return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
        return false;
    }
};

const saveIsPaired = (paired: boolean) => {
    if (paired) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
};

// Acumula chunks hasta encontrar el terminador \r — Web Serial puede entregar
// la respuesta partida en varios read() (ver bascula-test/README.md).
const readUntilCr = async (reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> => {
    const decoder = new TextDecoder();
    let buffer = "";
    while (!buffer.includes("\r")) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) buffer += decoder.decode(value);
    }
    return buffer;
};

const openPort = async (port: SerialPort): Promise<void> => {
    // El puerto puede llegar ya abierto (ej. HMR en desarrollo remontó el
    // provider y se perdió portRef, pero Chrome sigue teniendo el puerto
    // abierto de antes) — reintentar open() en ese caso lanza "Failed to
    // open port.", así que primero se checa si ya está listo para usarse.
    if (port.readable && port.writable) return;

    try {
        await port.open(SERIAL_OPTIONS);
    } catch {
        throw new Error(
            "No se pudo abrir el puerto de la báscula. Cierra cualquier otra pestaña o programa " +
            "que la esté usando (ej. una prueba previa de conexión) e intenta de nuevo.",
        );
    }
};

export const ScaleProvider = ({ children, enabled = false }: ScaleProviderProps) => {
    const isSupported = typeof navigator !== "undefined" && !!navigator.serial;
    const [isPaired, setIsPaired] = useState(() => loadIsPaired());
    const [isConnected, setIsConnected] = useState(false);
    const portRef = useRef<SerialPort | null>(null);

    // Reconecta en silencio a un puerto ya autorizado (sin mostrar el selector) —
    // usado por readWeightKg. Si nunca se emparejó desde Configuración, no hay
    // puerto conocido y esto no encuentra nada.
    const ensurePort = useCallback(async (): Promise<SerialPort> => {
        if (portRef.current) return portRef.current;

        const known = await navigator.serial!.getPorts();
        const port = known[0];
        if (!port) {
            throw new ScaleNotConnectedError("La báscula no está conectada — ve a Configuración y presiona \"Conectar báscula\"");
        }

        await openPort(port);
        portRef.current = port;
        setIsConnected(true);
        return port;
    }, []);

    const pair = useCallback(async () => {
        if (!isSupported) throw new Error("Este navegador no soporta báscula USB (usa Chrome o Edge de escritorio)");

        const port = await navigator.serial!.requestPort();
        await openPort(port);

        portRef.current = port;
        setIsConnected(true);
        setIsPaired(true);
        saveIsPaired(true);
    }, [isSupported]);

    const forget = useCallback(async () => {
        try {
            if (portRef.current) {
                await portRef.current.close();
                await portRef.current.forget?.();
            }
        } catch (error) {
            logUnexpectedError(error, "ScaleProvider.forget");
        } finally {
            portRef.current = null;
            setIsConnected(false);
            setIsPaired(false);
            saveIsPaired(false);
        }
    }, []);

    const readWeightKg = useCallback(async (): Promise<number> => {
        if (!enabled || !isSupported) {
            throw new Error("Báscula no disponible en este navegador (usa Chrome o Edge de escritorio)");
        }

        const port = await ensurePort();

        const writer = port.writable!.getWriter();
        try {
            await writer.write(new TextEncoder().encode("P"));
        } finally {
            writer.releaseLock();
        }

        const reader = port.readable!.getReader();
        let buffer: string;
        const timeoutId = setTimeout(() => reader.cancel().catch(() => {}), READ_TIMEOUT_MS);
        try {
            buffer = await readUntilCr(reader);
        } finally {
            clearTimeout(timeoutId);
            reader.releaseLock();
        }

        if (buffer === "") {
            throw new Error("La báscula no respondió — revisa que esté encendida y el cable USB conectado");
        }

        const weight = parseScaleWeightKg(buffer);
        if (weight === null) {
            throw new Error("No se pudo interpretar la respuesta de la báscula — intenta leer de nuevo");
        }
        return weight;
    }, [enabled, isSupported, ensurePort]);

    return (
        <ScaleContext.Provider value={{ isSupported, isConnected, isPaired, pair, forget, readWeightKg }}>
            {children}
        </ScaleContext.Provider>
    );
};
