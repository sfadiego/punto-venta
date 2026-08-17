import { Download, Loader } from "lucide-react";

interface DownloadReportButtonProps {
    onClick: () => void;
    disabled?: boolean;
    isDownloading?: boolean;
}

export const DownloadReportButton = ({ onClick, disabled = false, isDownloading = false }: DownloadReportButtonProps) => (
    <button
        onClick={onClick}
        disabled={disabled || isDownloading}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
            bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700
            transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-600"
    >
        {isDownloading ? <Loader size={15} className="animate-spin" /> : <Download size={15} />}
        Descargar reporte
    </button>
);
