import { Bluetooth, BluetoothOff, Loader, Printer, Unlink } from "lucide-react";
import { useBluetoothPrinterSection } from "./useBluetoothPrinterSection";

export const BluetoothPrinterSection = () => {
    const {
        isSupported,
        isConnected,
        isPaired,
        deviceName,
        isPairing,
        isTesting,
        handlePair,
        handleForget,
        handleTestPrint,
    } = useBluetoothPrinterSection();

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <div className="mb-4">
                <h2 className="text-sm font-semibold text-stone-700 mb-0.5">Impresora Bluetooth</h2>
                <p className="text-xs text-stone-400">
                    Empareja la impresora térmica directo desde este dispositivo (tablet/celular), sin agente local.
                </p>
            </div>

            {!isSupported ? (
                <div className="flex items-center gap-3 p-4 rounded-xl border bg-amber-50 border-amber-100">
                    <BluetoothOff size={20} className="text-amber-500 shrink-0" />
                    <p className="text-sm text-amber-700">
                        Este navegador no soporta Bluetooth. Usa Chrome en Android para emparejar la impresora.
                    </p>
                </div>
            ) : (
                <div
                    className={`flex items-center gap-3 p-4 rounded-xl border ${
                        isConnected ? "bg-emerald-50 border-emerald-100" : "bg-stone-50 border-stone-200"
                    }`}
                >
                    {isConnected
                        ? <Bluetooth size={20} className="text-emerald-500 shrink-0" />
                        : <BluetoothOff size={20} className="text-stone-400 shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isConnected ? "text-emerald-700" : "text-stone-500"}`}>
                            {isConnected
                                ? `Conectada — ${deviceName ?? "impresora"}`
                                : isPaired
                                    ? "Emparejada, sin conexión activa"
                                    : "Sin impresora emparejada"}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">
                            {isConnected
                                ? "Lista para imprimir tickets."
                                : isPaired
                                    ? "Vuelve a abrir la app o revisa que la impresora esté encendida."
                                    : "Enciende la impresora y presiona \"Emparejar\"."}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {isConnected && (
                            <button
                                onClick={handleTestPrint}
                                disabled={isTesting}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200
                                    bg-white text-emerald-700 text-xs font-medium hover:bg-emerald-50
                                    disabled:opacity-50 transition-colors"
                            >
                                {isTesting ? <Loader size={13} className="animate-spin" /> : <Printer size={13} />}
                                Imprimir prueba
                            </button>
                        )}

                        {isPaired ? (
                            <button
                                onClick={handleForget}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200
                                    bg-white text-stone-500 text-xs font-medium hover:bg-stone-50 transition-colors"
                            >
                                <Unlink size={13} />
                                Olvidar
                            </button>
                        ) : (
                            <button
                                onClick={handlePair}
                                disabled={isPairing}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200
                                    bg-white text-stone-700 text-xs font-medium hover:bg-stone-50
                                    disabled:opacity-50 transition-colors"
                            >
                                {isPairing ? <Loader size={13} className="animate-spin" /> : <Bluetooth size={13} />}
                                Emparejar
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
