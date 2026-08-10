import { useMutation } from "@tanstack/react-query";
import { superAdminAxios } from "@/contexts/SuperAdminContext";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

export type PrinterAgentPlatform = "win" | "mac";

export interface DownloadPrinterAgentPayload {
    printer: string;
    port: number;
    platform: PrinterAgentPlatform;
}

export const useDownloadPrinterAgent = () =>
    useMutation({
        mutationFn: (data: DownloadPrinterAgentPayload) =>
            superAdminAxios.post(ApiRoutes.SuperAdminPrinterAgent, data, { responseType: "blob" }),
    });
