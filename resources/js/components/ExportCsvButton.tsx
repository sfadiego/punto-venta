import { Download, Loader } from "lucide-react";

interface ExportCsvButtonProps {
    isDownloading: boolean;
    onClick: () => void;
    title: string;
    label?: string;
}

/** Botón compacto para descargar un reporte en CSV; muestra spinner y se deshabilita mientras descarga. */
export const ExportCsvButton = ({ isDownloading, onClick, title, label = "Exportar CSV" }: ExportCsvButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        disabled={isDownloading}
        title={title}
        className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-800 bg-white border border-stone-200 px-3 py-1.5 rounded-xl hover:bg-stone-50 transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
    >
        {isDownloading ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
        <span className="hidden sm:inline">{label}</span>
    </button>
);
