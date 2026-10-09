import { useState } from "react";
import { toast } from "react-toastify";
import { useDownloadTenantPrinterAgent, PrinterAgentPlatform } from "@/services/usePrinterAgentService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getBlobErrorMessage } from "@/utils/blobErrorMessage";
import { downloadBlob } from "@/utils/downloadFile";

const DEFAULT_PORT = "8765";

export const useAgentDownload = () => {
    const [printer, setPrinter] = useState("");
    const [port, setPort] = useState(DEFAULT_PORT);
    const [platform, setPlatform] = useState<PrinterAgentPlatform>("win");
    const [isDownloading, setIsDownloading] = useState(false);
    const { mutateAsync: downloadAgent } = useDownloadTenantPrinterAgent();

    const download = async () => {
        if (!printer.trim() || isDownloading) return;

        setIsDownloading(true);
        try {
            const res = await downloadAgent({ printer: printer.trim(), port: Number(port) || Number(DEFAULT_PORT), platform });
            downloadBlob(new Blob([res.data as BlobPart]), `print-agent-${platform}.zip`);
        } catch (error) {
            logUnexpectedError(error, "useAgentDownload.download");
            toast.error(await getBlobErrorMessage(error));
        } finally {
            setIsDownloading(false);
        }
    };

    return { printer, setPrinter, port, setPort, platform, setPlatform, isDownloading, download };
};
