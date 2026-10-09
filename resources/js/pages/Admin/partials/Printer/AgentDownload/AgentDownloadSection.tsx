import { Download, Loader } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { PrinterPlatformSelector } from "./PrinterPlatformSelector";
import { useAgentDownload } from "./useAgentDownload";

export const AgentDownloadSection = () => {
    const { printer, setPrinter, port, setPort, platform, setPlatform, isDownloading, download } =
        useAgentDownload();

    return (
        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-5">
            <div>
                <h2 className="text-sm font-semibold text-stone-700 mb-0.5">
                    Descargar agente de impresión
                </h2>
                <p className="text-xs text-stone-400">
                    Descarga el instalador ya configurado para instalarlo en esta computadora. Incluye el ejecutable y el <span className="font-mono">config.json</span> listo para usar.
                </p>
            </div>

            <div className="space-y-4">
                <PrinterPlatformSelector value={platform} onChange={setPlatform} />

                <div>
                    <Input
                        name="printer"
                        label="Nombre de impresora"
                        value={printer}
                        onChange={(e) => setPrinter(e.target.value)}
                        placeholder="EPSON_TM-T20"
                        maxLength={100}
                    />
                    <p className="text-xs text-stone-400 mt-1">
                        Debe coincidir exactamente con el nombre de la impresora en el sistema del cliente.
                    </p>
                </div>

                <div>
                    <Input
                        name="port"
                        label="Puerto WebSocket"
                        inputType="number"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        min={1024}
                        max={65535}
                    />
                    <p className="text-xs text-stone-400 mt-1">Por defecto 8765. Cambiar solo si hay conflicto de puertos.</p>
                </div>

                <button
                    type="button"
                    onClick={download}
                    disabled={!printer.trim() || isDownloading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                        bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                    {isDownloading ? <Loader size={15} className="animate-spin" /> : <Download size={15} />}
                    Descargar para {platform === "win" ? "Windows" : "macOS"}
                </button>
            </div>
        </section>
    );
};
