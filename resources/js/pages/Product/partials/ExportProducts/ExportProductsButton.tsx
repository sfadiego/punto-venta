import { Download, Loader } from "lucide-react";
import { useExportProductsButton } from "./useExportProductsButton";

/** Botón de la cabecera de Productos que descarga el catálogo completo en CSV (solo retail). */
export const ExportProductsButton = () => {
    const { isAvailable, isDownloading, handleDownload } = useExportProductsButton();

    if (!isAvailable) return null;

    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading}
            title="Descargar catálogo (CSV)"
            className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-700 bg-white border border-stone-200 px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
            {isDownloading ? <Loader size={15} className="animate-spin" /> : <Download size={15} />}
            <span className="hidden sm:inline">Descargar catálogo</span>
        </button>
    );
};
