import { Download, Loader, Monitor, Apple } from "lucide-react";
import { usePrinterAgentDownload } from "./usePrinterAgentDownload";

export const PrinterAgentSection = () => {
    const { printer, setPrinter, port, setPort, platform, setPlatform, isDownloading, download } =
        usePrinterAgentDownload();

    return (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                    Agente de impresión
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                    Genera el instalador configurado para entregar al cliente. Incluye el ejecutable y el <span className="font-mono">config.json</span> listo para usar.
                </p>
            </div>

            <form onSubmit={download} className="space-y-4">
                {/* Platform selector */}
                <div className="grid grid-cols-2 gap-2">
                    {([
                        { value: "win", label: "Windows", Icon: Monitor },
                        { value: "mac", label: "macOS",   Icon: Apple  },
                    ] as const).map(({ value, label, Icon }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setPlatform(value)}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors
                                ${platform === value
                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"}`}
                        >
                            <Icon size={15} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Printer name */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Nombre de impresora
                    </label>
                    <input
                        type="text"
                        value={printer}
                        onChange={e => setPrinter(e.target.value)}
                        placeholder="EPSON_TM-T20"
                        maxLength={100}
                        required
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                            focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                        Debe coincidir exactamente con el nombre de la impresora en el sistema del cliente.
                    </p>
                </div>

                {/* Port */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Puerto WebSocket
                    </label>
                    <input
                        type="number"
                        value={port}
                        onChange={e => setPort(e.target.value)}
                        min={1024}
                        max={65535}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                            focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    />
                    <p className="text-xs text-slate-400 mt-1">Por defecto 8765. Cambiar solo si hay conflicto de puertos.</p>
                </div>

                <button
                    type="submit"
                    disabled={!printer.trim() || isDownloading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                        bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                    {isDownloading
                        ? <Loader size={15} className="animate-spin" />
                        : <Download size={15} />
                    }
                    Descargar para {platform === "win" ? "Windows" : "macOS"}
                </button>
            </form>
        </section>
    );
};
