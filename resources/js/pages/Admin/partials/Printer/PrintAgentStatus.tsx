import { Printer, Loader, Wifi, WifiOff } from "lucide-react";
import { usePrintAgent } from "@/hooks/usePrintAgent";
import { useTestPrint } from "./useTestPrint";

export const PrintAgentStatus = () => {
    const { isConnected } = usePrintAgent();
    const { testPrint, isPending: isTestPending } = useTestPrint();

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <div className="mb-4">
                <h2 className="text-sm font-semibold text-stone-700 mb-0.5">Agente de impresión</h2>
                <p className="text-xs text-stone-400">Estado de conexión con el agente local</p>
            </div>

            <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                isConnected ? "bg-emerald-50 border-emerald-100" : "bg-stone-50 border-stone-200"
            }`}>
                {isConnected
                    ? <Wifi size={20} className="text-emerald-500 shrink-0" />
                    : <WifiOff size={20} className="text-stone-400 shrink-0" />
                }
                <div className="flex-1">
                    <p className={`text-sm font-medium ${isConnected ? "text-emerald-700" : "text-stone-500"}`}>
                        {isConnected ? "Agente conectado" : "Agente desconectado"}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                        {isConnected
                            ? "La impresora está lista para imprimir tickets."
                            : "Verifica que el agente esté corriendo en esta máquina."}
                    </p>
                </div>

                {isConnected && (
                    <button
                        onClick={testPrint}
                        disabled={isTestPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200
                            bg-white text-emerald-700 text-xs font-medium hover:bg-emerald-50
                            disabled:opacity-50 transition-colors shrink-0"
                    >
                        {isTestPending
                            ? <Loader size={13} className="animate-spin" />
                            : <Printer size={13} />
                        }
                        Imprimir prueba
                    </button>
                )}
            </div>
        </div>
    );
};
