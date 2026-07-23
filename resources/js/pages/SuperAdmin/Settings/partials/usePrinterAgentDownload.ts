import { useState } from "react";
import { superAdminAxios } from "@/contexts/SuperAdminContext";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { isAxiosError } from "@/utils/axiosError";
import { toast } from "react-toastify";

type Platform = "win" | "mac";

const parseErrorMessage = async (error: unknown): Promise<string> => {
    if (!isAxiosError(error)) return "Error inesperado al descargar";
    const data = error.response?.data;
    if (data instanceof Blob) {
        try {
            const text = await data.text();
            const json = JSON.parse(text) as { message?: string };
            return json.message ?? "Error del servidor";
        } catch {
            return "Error del servidor";
        }
    }
    return (data as { message?: string })?.message ?? "Error del servidor";
};

export const usePrinterAgentDownload = () => {
    const [printer, setPrinter] = useState("");
    const [port, setPort] = useState("8765");
    const [platform, setPlatform] = useState<Platform>("win");
    const [isDownloading, setIsDownloading] = useState(false);

    const download = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!printer.trim()) return;

        setIsDownloading(true);
        try {
            const res = await superAdminAxios.post(
                ApiRoutes.SuperAdminPrinterAgent,
                { printer: printer.trim(), port: Number(port) || 8765, platform },
                { responseType: "blob" },
            );

            const url = URL.createObjectURL(new Blob([res.data as BlobPart]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `print-agent-${platform}.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            logUnexpectedError(error, "usePrinterAgentDownload.download");
            const msg = await parseErrorMessage(error);
            toast.error(msg);
        } finally {
            setIsDownloading(false);
        }
    };

    return { printer, setPrinter, port, setPort, platform, setPlatform, isDownloading, download };
};
