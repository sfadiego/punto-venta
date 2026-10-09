import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { useAxios } from "@/hooks/useAxios";
import { useExportProductCatalog } from "@/services/useProductService";
import { downloadBlob } from "@/utils/downloadFile";
import { localDateString } from "@/utils/dateUtils";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

export const useExportProductsButton = () => {
    const { features } = useAxios();
    const exportCatalog = useExportProductCatalog();
    const [isDownloading, setIsDownloading] = useState(false);
    // Guard síncrono contra doble clic: el estado tarda un render en deshabilitar el botón.
    const inFlightRef = useRef(false);

    // El backend solo expone la exportación a negocios retail (middleware `retail`).
    const isAvailable = features?.is_retail === true;

    const handleDownload = async () => {
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        setIsDownloading(true);
        try {
            const blob = await exportCatalog();
            downloadBlob(blob, `catalogo-productos-${localDateString()}.csv`);
        } catch (error) {
            logUnexpectedError(error, "useExportProductsButton.handleDownload");
            toast.error(getUserFacingErrorMessage(error, "Error al descargar el catálogo"));
        } finally {
            inFlightRef.current = false;
            setIsDownloading(false);
        }
    };

    return { isAvailable, isDownloading, handleDownload };
};
