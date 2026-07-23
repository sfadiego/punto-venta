import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { BLE_PRINTER_CANDIDATE_SERVICES, chunkBytes } from "@/utils/blePrinter";
import { logUnexpectedError } from "@/plugins/logger.plugin";

const STORAGE_KEY = "ble_printer_pairing";

interface StoredPairing {
    deviceId: string;
    serviceUuid: string;
    characteristicUuid: string;
}

interface BluetoothPrintContextType {
    isSupported: boolean;
    isConnected: boolean;
    isPaired: boolean;
    deviceName: string | null;
    pair: () => Promise<void>;
    forget: () => void;
    print: (bytes: Uint8Array) => Promise<void>;
}

const notMounted = async (): Promise<never> => {
    throw new Error("BluetoothPrintProvider no montado");
};

export const BluetoothPrintContext = createContext<BluetoothPrintContextType>({
    isSupported: false,
    isConnected: false,
    isPaired: false,
    deviceName: null,
    pair: notMounted,
    forget: () => {},
    print: notMounted,
});

interface BluetoothPrintProviderProps {
    children: React.ReactNode;
    enabled?: boolean;
}

const loadPairing = (): StoredPairing | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as StoredPairing) : null;
    } catch {
        return null;
    }
};

const savePairing = (pairing: StoredPairing | null) => {
    if (pairing) localStorage.setItem(STORAGE_KEY, JSON.stringify(pairing));
    else localStorage.removeItem(STORAGE_KEY);
};

// Busca, entre los servicios candidatos conocidos, la primera característica
// escribible (write o writeWithoutResponse) — ese es el canal por el que la
// impresora recibe los bytes ESC/POS crudos. Ver utils/blePrinter.ts.
const findWritableCharacteristic = async (
    server: BluetoothRemoteGATTServer,
): Promise<BluetoothRemoteGATTCharacteristic | null> => {
    for (const serviceUuid of BLE_PRINTER_CANDIDATE_SERVICES) {
        try {
            const service = await server.getPrimaryService(serviceUuid);
            const chars = await service.getCharacteristics();
            const writable = chars.find((c) => c.properties.write || c.properties.writeWithoutResponse);
            if (writable) return writable;
        } catch {
            // Servicio no presente en este dispositivo — se prueba el siguiente candidato.
        }
    }
    return null;
};

export const BluetoothPrintProvider = ({ children, enabled = false }: BluetoothPrintProviderProps) => {
    const isSupported = typeof navigator !== "undefined" && !!navigator.bluetooth;
    const [pairing, setPairing] = useState<StoredPairing | null>(() => loadPairing());
    const [deviceName, setDeviceName] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const charRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
    const deviceRef = useRef<BluetoothDevice | null>(null);

    const handleDisconnected = useCallback(() => {
        setIsConnected(false);
        charRef.current = null;
    }, []);

    const attachDevice = useCallback((device: BluetoothDevice, char: BluetoothRemoteGATTCharacteristic) => {
        deviceRef.current?.removeEventListener("gattserverdisconnected", handleDisconnected);
        deviceRef.current = device;
        device.addEventListener("gattserverdisconnected", handleDisconnected);
        charRef.current = char;
        setDeviceName(device.name ?? null);
        setIsConnected(true);
    }, [handleDisconnected]);

    // Reconecta en silencio a un dispositivo ya emparejado antes (sin volver a
    // mostrar el selector) usando el API de permisos persistentes de Chrome/Android.
    useEffect(() => {
        if (!enabled || !isSupported || !pairing) return;
        let cancelled = false;

        (async () => {
            try {
                const known = await navigator.bluetooth!.getDevices?.();
                const device = known?.find((d) => d.id === pairing.deviceId);
                if (!device?.gatt || cancelled) return;

                const server = await device.gatt.connect();
                const service = await server.getPrimaryService(pairing.serviceUuid);
                const char = await service.getCharacteristic(pairing.characteristicUuid);
                if (cancelled) return;
                attachDevice(device, char);
            } catch (error) {
                // El usuario deberá volver a emparejar manualmente desde Configuración.
                logUnexpectedError(error, "BluetoothPrintProvider.silentReconnect");
            }
        })();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, isSupported, pairing]);

    useEffect(() => {
        return () => {
            deviceRef.current?.removeEventListener("gattserverdisconnected", handleDisconnected);
            if (deviceRef.current?.gatt?.connected) deviceRef.current.gatt.disconnect();
        };
    }, [handleDisconnected]);

    const pair = useCallback(async () => {
        if (!isSupported) throw new Error("Este navegador no soporta Bluetooth (usa Chrome en Android)");

        const device = await navigator.bluetooth!.requestDevice({
            acceptAllDevices: true,
            optionalServices: BLE_PRINTER_CANDIDATE_SERVICES,
        });
        if (!device.gatt) throw new Error("El dispositivo elegido no soporta GATT");

        const server = await device.gatt.connect();
        const char = await findWritableCharacteristic(server);
        if (!char) {
            server.disconnect();
            throw new Error("No se encontró un canal de escritura conocido en esta impresora");
        }

        savePairing({
            deviceId: device.id,
            serviceUuid: char.service.uuid,
            characteristicUuid: char.uuid,
        });
        setPairing(loadPairing());
        attachDevice(device, char);
    }, [isSupported, attachDevice]);

    const forget = useCallback(() => {
        if (deviceRef.current?.gatt?.connected) deviceRef.current.gatt.disconnect();
        deviceRef.current?.removeEventListener("gattserverdisconnected", handleDisconnected);
        deviceRef.current = null;
        charRef.current = null;
        savePairing(null);
        setPairing(null);
        setDeviceName(null);
        setIsConnected(false);
    }, [handleDisconnected]);

    const print = useCallback(async (bytes: Uint8Array): Promise<void> => {
        const char = charRef.current;
        if (!char) throw new Error("Impresora Bluetooth no conectada");

        const useNoResponse = char.properties.writeWithoutResponse;
        for (const chunk of chunkBytes(bytes)) {
            if (useNoResponse) {
                await char.writeValueWithoutResponse(chunk as Uint8Array<ArrayBuffer>);
            } else {
                await char.writeValue(chunk as Uint8Array<ArrayBuffer>);
            }
            await new Promise((resolve) => setTimeout(resolve, 20));
        }
    }, []);

    return (
        <BluetoothPrintContext.Provider
            value={{ isSupported, isConnected, isPaired: !!pairing, deviceName, pair, forget, print }}
        >
            {children}
        </BluetoothPrintContext.Provider>
    );
};
