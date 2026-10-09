import { useMutation } from "@tanstack/react-query";
import { superAdminAxios } from "@/contexts/SuperAdminContext";
import { axiosPOST } from "@/hooks/useApi";
import { useAxios } from "@/hooks/useAxios";
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

// Descarga desde la Configuración del propio negocio (sesión del Admin del tenant).
export const useDownloadTenantPrinterAgent = () => {
    const { axiosApi } = useAxios();

    return useMutation({
        mutationFn: (data: DownloadPrinterAgentPayload) =>
            axiosPOST<DownloadPrinterAgentPayload, undefined>(axiosApi, {
                url: ApiRoutes.PrinterAgentDownload,
                data,
                responseType: "blob",
            }),
    });
};
