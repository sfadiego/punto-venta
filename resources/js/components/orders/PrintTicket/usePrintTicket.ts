import { useMutation } from "@tanstack/react-query";
import { usePrintAgent } from "@/hooks/usePrintAgent";
import { usePrintOrder, useFetchPrintBytes } from "@/services/useOrderService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { reportClientError } from "@/utils/reportClientError";
import { toast } from "react-toastify";

export const usePrintTicket = (orderId: number) => {
    const { data: businessConfig } = useGetBusinessConfig();
    const { isConnected: agentConnected, print: agentPrint } = usePrintAgent();
    const { mutateAsync: printOrder } = usePrintOrder();
    const fetchPrintBytes = useFetchPrintBytes();

    // Impresión vía servidor (CUPS/red) — fallback cuando no hay agente local
    const { mutate: sendPrintServer, isPending: isPendingServer } = useMutation({
        mutationFn: () => printOrder(orderId),
        onSuccess: () => toast.success("Ticket enviado a la impresora"),
        onError: () => toast.error("Impresora no disponible"),
    });

    // Impresión vía agente WebSocket local
    const { mutate: sendPrintAgent, isPending: isPendingAgent } = useMutation({
        mutationFn: async () => {
            const bytes = await fetchPrintBytes(orderId);
            await agentPrint(new Uint8Array(bytes as ArrayBuffer));
        },
        onSuccess: () => toast.success("Ticket impreso"),
        onError: (err: Error) => {
            toast.error(`Error: ${err.message}`);
            reportClientError({ message: err.message, stack: err.stack, context: "print-agent" });
        },
    });

    const print = () => {
        if (agentConnected) {
            sendPrintAgent();
            return;
        }

        // En producción con agente habilitado el servidor no puede imprimir — el agente es el único path válido
        if (businessConfig?.printer_enabled) {
            toast.error("Agente de impresión no conectado. Verifica que el agente esté corriendo en esta máquina.");
            return;
        }

        // Config aún cargando — esperar
        if (!businessConfig) return;

        // Fallback local: impresión vía servidor (CUPS / red)
        if (!businessConfig.printer_name?.trim()) {
            toast.warning("Impresora no configurada. Ve a Configuración → Impresora para agregarla.");
            return;
        }

        sendPrintServer();
    };

    // Visible cuando: config cargando, printer_enabled activo (agente), o printer_name configurado (servidor).
    const isVisible = !businessConfig
        || !!businessConfig.printer_enabled
        || !!businessConfig.printer_name?.trim();

    return { print, isPending: isPendingAgent || isPendingServer, isVisible };
};
