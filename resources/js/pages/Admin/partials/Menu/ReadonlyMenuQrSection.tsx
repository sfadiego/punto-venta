import { useState } from "react";
import { QrCode, Loader, Copy, Check } from "lucide-react";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { useQrDownload } from "./useQrDownload";

interface ReadonlyMenuQrSectionProps {
    config: IBusinessConfig | undefined;
}

export const ReadonlyMenuQrSection = ({ config }: ReadonlyMenuQrSectionProps) => {
    const [copied, setCopied] = useState(false);

    const menuUrl = config?.slug
        ? `${window.location.origin}/${config.slug}/menu?readonly=true`
        : null;

    const { downloadQr, isGenerating } = useQrDownload(
        menuUrl,
        config?.business_name ?? "Menu",
        "Escanea para ver el menú",
        "qr-menu-readonly",
    );

    const handleCopy = () => {
        if (!menuUrl) return;
        navigator.clipboard.writeText(menuUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-5">
            <div>
                <h2 className="text-sm font-semibold text-stone-700 mb-0.5">Menú de solo lectura</h2>
                <p className="text-xs text-stone-400">
                    Descarga un código QR que muestra el menú sin permitir hacer pedidos, ideal para imprimir y colocar en mesas
                </p>
            </div>

            {menuUrl && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2.5">
                        <a
                            href={menuUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-xs text-stone-500 truncate hover:text-amber-600 hover:underline"
                        >
                            {menuUrl}
                        </a>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="shrink-0 text-stone-400 hover:text-amber-500 transition-colors"
                            title="Copiar enlace"
                        >
                            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={downloadQr}
                        disabled={isGenerating}
                        className="flex items-center gap-2 w-full justify-center px-3 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating
                            ? <Loader size={13} className="animate-spin" />
                            : <QrCode size={13} />
                        }
                        {isGenerating ? "Generando..." : "Descargar código QR de solo lectura"}
                    </button>
                </div>
            )}
        </div>
    );
};
