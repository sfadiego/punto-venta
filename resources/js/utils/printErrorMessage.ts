const PRINTER_NOT_FOUND = "No se encontró la impresora. Verifica que esté conectada y encendida; si el problema continúa, contacta a soporte.";
const PRINTER_NOT_RESPONDING = "La impresora no responde. Revisa que esté encendida, con papel y bien conectada, e inténtalo de nuevo.";
const AGENT_DISCONNECTED = "Se perdió la conexión con el agente de impresión. Verifica que esté abierto en este equipo.";
const PRINT_FAILED = "No se pudo imprimir el ticket. Revisa que la impresora esté encendida y conectada.";

// Los agentes ya instalados envían mensajes técnicos (nombres de cola, config.json, comandos del sistema).
// Se traducen aquí para que el usuario nunca los vea; los mensajes que no coinciden se muestran tal cual.
const TECHNICAL_RULES: Array<[RegExp, string]> = [
    [/no existe en este equipo|Invalid destination/i, PRINTER_NOT_FOUND],
    [/deshabilitada|disabled/i, PRINTER_NOT_RESPONDING],
    [/agente desconectado/i, AGENT_DISCONNECTED],
    [/config\.json|cupsenable|lpstat|lp:|stderr|ENOENT|Command failed|archivo temporal|Plataforma no soportada/i, PRINT_FAILED],
];

export const getPrintErrorMessage = (error: unknown, fallback = PRINT_FAILED): string => {
    const message = error instanceof Error ? error.message : "";
    if (!message) return fallback;

    const rule = TECHNICAL_RULES.find(([pattern]) => pattern.test(message));
    return rule ? rule[1] : message;
};
