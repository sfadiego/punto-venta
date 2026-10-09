import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { downloadBlob } from "@/utils/downloadFile";
import { localDateString } from "@/utils/dateUtils";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

interface UseCsvDownloadParams {
    /** Pide el CSV al backend (hook de servicio). */
    fetchFile: () => Promise<Blob>;
    /** Nombre sin extensión ni fecha: se descarga como `<fileName>-AAAA-MM-DD.csv`. */
    fileName: string;
    errorMessage: string;
}

// Descarga de un reporte CSV con guard contra doble clic (el estado tarda un render en deshabilitar el botón).
export const useCsvDownload = ({ fetchFile, fileName, errorMessage }: UseCsvDownloadParams) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const inFlightRef = useRef(false);

    const handleDownload = async () => {
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        setIsDownloading(true);
        try {
            const blob = await fetchFile();
            downloadBlob(blob, `${fileName}-${localDateString()}.csv`);
        } catch (error) {
            logUnexpectedError(error, "useCsvDownload.handleDownload");
            toast.error(getUserFacingErrorMessage(error, errorMessage));
        } finally {
            inFlightRef.current = false;
            setIsDownloading(false);
        }
    };

    return { isDownloading, handleDownload };
};
