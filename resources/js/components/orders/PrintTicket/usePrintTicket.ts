import { useMutation } from "@tanstack/react-query";
import { usePrintAgent } from "@/hooks/usePrintAgent";
import { useBluetoothPrint } from "@/hooks/useBluetoothPrint";
import { usePrintOrder, useFetchPrintBytes, IPrintTarget } from "@/services/useOrderService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { reportClientError } from "@/utils/reportClientError";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { getPrintErrorMessage } from "@/utils/printErrorMessage";
import { canOfferPrint, PrintRouteEnum, resolvePrintRoute } from "@/utils/printRoute";
import { toast } from "react-toastify";

export const usePrintTicket = () => {
    const { data: businessConfig } = useGetBusinessConfig();
    const { isConnected: agentConnected, print: agentPrint } = usePrintAgent();
    const { isConnected: bleConnected, print: blePrint } = useBluetoothPrint();
    const { mutateAsync: printOrder } = usePrintOrder();
    const fetchPrintBytes = useFetchPrintBytes();

    // Impresión vía servidor (CUPS/red) — fallback cuando no hay agente local
    const { mutate: sendPrintServer, isPending: isPendingServer } = useMutation({
        mutationFn: (target: IPrintTarget) => printOrder(target),
        onSuccess: () => toast.success("Ticket enviado a la impresora"),
        onError: (error) => toast.error(getUserFacingErrorMessage(error, "Impresora no disponible")),
    });

    // Impresión vía agente WebSocket local
    const { mutate: sendPrintAgent, isPending: isPendingAgent } = useMutation({
        mutationFn: async (target: IPrintTarget) => {
            const bytes = await fetchPrintBytes(target);
            await agentPrint(new Uint8Array(bytes as ArrayBuffer));
        },
        onSuccess: () => toast.success("Ticket impreso"),
        onError: (err: Error) => {
            toast.error(getUserFacingErrorMessage(err, getPrintErrorMessage(err)));
            reportClientError({ message: err.message, stack: err.stack, context: "print-agent" });
        },
    });

    // Impresión vía Bluetooth (tablet, sin agente)
    const { mutate: sendPrintBluetooth, isPending: isPendingBluetooth } = useMutation({
        mutationFn: async (target: IPrintTarget) => {
            const bytes = await fetchPrintBytes(target);
            await blePrint(new Uint8Array(bytes as ArrayBuffer));
        },
        onSuccess: () => toast.success("Ticket impreso"),
        onError: (err: Error) => {
            toast.error(getUserFacingErrorMessage(err, getPrintErrorMessage(err)));
            reportClientError({ message: err.message, stack: err.stack, context: "print-bluetooth" });
        },
    });

    const route = resolvePrintRoute({ agentConnected, bleConnected, config: businessConfig });

    // `returnId` imprime el comprobante de esa devolución en lugar del ticket de la orden.
    const print = (orderId: number, returnId?: number) => {
        const target: IPrintTarget = { orderId, returnId };

        switch (route) {
            case PrintRouteEnum.Agent:
                sendPrintAgent(target);
                return;
            case PrintRouteEnum.Bluetooth:
                sendPrintBluetooth(target);
                return;
            case PrintRouteEnum.AgentMissing:
                toast.error("Agente de impresión no conectado. Verifica que el agente esté corriendo en esta máquina.");
                return;
            case PrintRouteEnum.BluetoothMissing:
                toast.error("Impresora Bluetooth no conectada. Ve a Configuración → Impresora para emparejarla.");
                return;
            case PrintRouteEnum.Unconfigured:
                toast.warning("Impresora no configurada. Ve a Configuración → Impresora para agregarla.");
                return;
            case PrintRouteEnum.Server:
                sendPrintServer(target);
                return;
            case PrintRouteEnum.Loading:
                return;
        }
    };

    // El botón se muestra mientras la config carga o haya algún medio de impresión configurado/conectado.
    const isVisible = route === PrintRouteEnum.Loading || canOfferPrint(route);

    // Criterio para ofrecer "¿Imprimir ticket?" tras cobrar, abonar o devolver (config ya cargada).
    const canPrint = canOfferPrint(route);

    return { print, isPending: isPendingAgent || isPendingBluetooth || isPendingServer, isVisible, canPrint };
};
