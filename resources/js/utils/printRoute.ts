import { IBusinessConfig } from "@/models/IBusinessConfig";

export enum PrintRouteEnum {
    Loading = "loading",
    Agent = "agent",
    Bluetooth = "bluetooth",
    AgentMissing = "agent-missing",
    BluetoothMissing = "bluetooth-missing",
    Server = "server",
    Unconfigured = "unconfigured",
}

type PrintConfig = Pick<IBusinessConfig, "printer_enabled" | "bluetooth_printing_enabled" | "printer_name" | "printer_host">;

interface PrintRouteInput {
    agentConnected: boolean;
    bleConnected: boolean;
    config?: PrintConfig | null;
}

// Por dónde se imprimiría ahora mismo. Hay dos configuraciones de negocio distintas:
//  - Agente local (producción): `printer_enabled`; la impresora se define en el config.json del agente.
//  - Servidor/red (local o clientes sin agente): `printer_name` y/o `printer_host` en el negocio
//    (el driver `network` usa el host; cups/macos/windows usan el nombre).
export const resolvePrintRoute = ({ agentConnected, bleConnected, config }: PrintRouteInput): PrintRouteEnum => {
    if (agentConnected) return PrintRouteEnum.Agent;
    if (bleConnected) return PrintRouteEnum.Bluetooth;
    if (!config) return PrintRouteEnum.Loading;
    // Con agente habilitado el servidor no puede imprimir: el agente es el único camino válido.
    if (config.printer_enabled) return PrintRouteEnum.AgentMissing;
    if (config.bluetooth_printing_enabled) return PrintRouteEnum.BluetoothMissing;
    if (config.printer_name?.trim() || config.printer_host?.trim()) return PrintRouteEnum.Server;
    return PrintRouteEnum.Unconfigured;
};

// Rutas con las que tiene sentido ofrecer "¿Imprimir ticket?": hay un medio de impresión configurado.
// Si el medio falta (agente apagado), igual se ofrece: al confirmar el usuario recibe el aviso de qué revisar.
export const canOfferPrint = (route: PrintRouteEnum): boolean =>
    route !== PrintRouteEnum.Loading && route !== PrintRouteEnum.Unconfigured;
