import { toast } from "react-toastify";
import { usePrintAgent } from "@/hooks/usePrintAgent";
import { useBluetoothPrint } from "@/hooks/useBluetoothPrint";
import { useOpenCashDrawer } from "@/services/useOrderService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { PrintRouteEnum, resolvePrintRoute } from "@/utils/printRoute";
import { CASH_DRAWER_PULSE } from "@/utils/cashDrawer";

// Abre el cajón de dinero al cobrar una orden en efectivo. Es una señal propia, separada del ticket:
// imprimir o reimprimir nunca abre la caja. No bloquea el cobro: si falla, solo avisa. Sin impresora
// disponible (o con la opción apagada en el negocio) no hace nada ni muestra avisos.
export const useCashDrawer = () => {
    const { data: businessConfig } = useGetBusinessConfig();
    const { isConnected: agentConnected, print: agentPrint } = usePrintAgent();
    const { isConnected: bleConnected, print: blePrint } = useBluetoothPrint();
    const { mutateAsync: openFromServer } = useOpenCashDrawer();

    const route = resolvePrintRoute({ agentConnected, bleConnected, config: businessConfig });

    const openCashDrawer = async () => {
        if (!businessConfig?.open_cash_drawer) return;

        try {
            switch (route) {
                case PrintRouteEnum.Agent:
                    await agentPrint(CASH_DRAWER_PULSE);
                    return;
                case PrintRouteEnum.Bluetooth:
                    await blePrint(CASH_DRAWER_PULSE);
                    return;
                case PrintRouteEnum.Server:
                    await openFromServer();
                    return;
                default:
                    return;
            }
        } catch (error) {
            logUnexpectedError(error, "useCashDrawer.openCashDrawer");
            toast.error(getUserFacingErrorMessage(error, "No se pudo abrir la caja"));
        }
    };

    return { openCashDrawer };
};
