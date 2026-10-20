import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { IProduct } from "@/models/IProduct";
import { useExportProductBarcodeImage } from "@/services/useProductService";
import { downloadBlob } from "@/utils/downloadFile";
import { getBarcodeImageFilename } from "@/utils/catalogExport";
import { getBlobErrorMessage } from "@/utils/blobErrorMessage";
import { logUnexpectedError } from "@/plugins/logger.plugin";

/** Descarga la imagen del código de barras de un producto desde su fila en la tabla (solo retail). */
export const useProductBarcodeDownload = (product: IProduct) => {
    const exportBarcodeImage = useExportProductBarcodeImage();
    const [isDownloading, setIsDownloading] = useState(false);
    // Guard síncrono contra doble clic: el estado tarda un render en deshabilitar el botón.
    const inFlightRef = useRef(false);

    const handleDownload = async () => {
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        setIsDownloading(true);
        try {
            const blob = await exportBarcodeImage(product.id);
            downloadBlob(blob, getBarcodeImageFilename(product));
        } catch (error) {
            logUnexpectedError(error, "useProductBarcodeDownload.handleDownload");
            toast.error(await getBlobErrorMessage(error));
        } finally {
            inFlightRef.current = false;
            setIsDownloading(false);
        }
    };

    return { isDownloading, handleDownload };
};
