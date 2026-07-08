import { useMutation } from "@tanstack/react-query";
import { axiosPOST } from "@/hooks/useApi";
import { useAxios } from "@/hooks/useAxios";
import { usePrintAgent } from "@/hooks/usePrintAgent";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { toast } from "react-toastify";

export const usePrintTicket = (orderId: number) => {
    const { axiosApi } = useAxios();
    const { data: businessConfig } = useGetBusinessConfig();
    const { isConnected: agentConnected, print: agentPrint } = usePrintAgent();

    // Impresión vía servidor (CUPS/red) — fallback cuando no hay agente local
    const { mutate: sendPrintServer, isPending: isPendingServer } = useMutation({
        mutationFn: () =>
            axiosPOST(axiosApi, {
                url: `${ApiRoutes.Orders}/${orderId}/print`,
                data: {},
            }),
        onSuccess: () => toast.success("Ticket enviado a la impresora"),
        onError: () => toast.error("Impresora no disponible"),
    });

    // Impresión vía agente WebSocket local
    const { mutate: sendPrintAgent, isPending: isPendingAgent } = useMutation({
        mutationFn: async () => {
            const url = ApiRoutes.PrintBytes.replace(":id", String(orderId));
            const res = await axiosApi.get(url, { responseType: "arraybuffer" });
            await agentPrint(new Uint8Array(res.data as ArrayBuffer));
        },
        onSuccess: () => toast.success("Ticket impreso"),
        onError: (err: Error) => toast.error(`Error: ${err.message}`),
    });

    const isLocal = import.meta.env.VITE_APP_ENV === "local";

    const print = () => {
        if (agentConnected) {
            sendPrintAgent();
            return;
        }

        // Fallback servidor: solo disponible en local con impresora configurada
        if (isLocal && businessConfig?.printer_name?.trim()) {
            sendPrintServer();
            return;
        }

        if (isLocal) {
            toast.warning("Impresora no configurada. Ve a Configuración → Impresora para agregarla.");
        } else {
            toast.error("Agente de impresión no conectado. Verifica que el agente esté corriendo en esta máquina.");
        }
    };

    return { print, isPending: isPendingAgent || isPendingServer };
};
