import { createLogger, format } from "winston";
import { transports } from "winston";
import axios from "axios";
import axiosApi from "@/configs/axiosConfig";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

const { combine, timestamp, errors, printf, colorize, json } = format;

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ClientMeta {
    tenant_slug: string;
    user_id: number | null;
    usuario: string;
}

interface ApiLogPayload {
    message: string;
    stack?: string;
    context: string;
    url: string;
    tenant_slug: string;
    user_id: number | null;
    usuario: string;
}

// ─── Metadata del cliente activo ──────────────────────────────────────────────

const getClientMeta = (): ClientMeta => {
    try {
        const raw = localStorage.getItem("user");
        const user = raw ? (JSON.parse(raw) as { id?: number; usuario?: string }) : null;
        return {
            tenant_slug: localStorage.getItem("tenantSlug") ?? "unknown",
            user_id:     user?.id      ?? null,
            usuario:     user?.usuario ?? "unknown",
        };
    } catch {
        return { tenant_slug: "unknown", user_id: null, usuario: "unknown" };
    }
};

// ─── Instancia Winston (solo console en dev) ───────────────────────────────────
//
// La librería Winston tiene un browser build (`"browser": "./dist/winston"`)
// cuyo Console transport usa console.error/warn/log en lugar de process.stdout,
// por lo que es seguro en Vite.
// El envío a la API se maneja por separado (ver sendToApi) para evitar
// depender de `winston-transport` como dependencia directa de pnpm.

const isDev = import.meta.env.VITE_APP_ENV === "local";

const devFormat = combine(
    colorize(),
    timestamp({ format: "HH:mm:ss" }),
    printf(({ level, message, context, timestamp: ts }) =>
        `[${ts as string}] ${level} ${context ? `[${context as string}] ` : ""}${message as string}`,
    ),
);

const logger = createLogger({
    level: "error",
    format: combine(errors({ stack: true }), timestamp(), json()),
    transports: isDev ? [new transports.Console({ format: devFormat })] : [],
    exitOnError: false,
    silent: !isDev, // en producción el logger solo envía al API (ver sendToApi)
});

// ─── Envío al backend (crea log por cliente en storage/logs/clients/) ──────────

const sendToApi = (payload: ApiLogPayload): void => {
    axiosApi.post(ApiRoutes.ClientErrorLog, payload).catch(() => {
        // Fallback a sendBeacon si la sesión expiró o axios falló
        navigator.sendBeacon(
            ApiRoutes.ClientErrorLog,
            JSON.stringify({
                message: payload.message,
                stack:   payload.stack,
                url:     payload.url,
            }),
        );
    });
};

// ─── Filtro: omitir errores controlados ───────────────────────────────────────

const SKIPPED_STATUSES = new Set([401, 403, 422]);

const isHandledError = (error: unknown): boolean => {
    if (!axios.isAxiosError(error)) return false;
    const status = error.response?.status;
    return status !== undefined && SKIPPED_STATUSES.has(status);
};

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Registra un error inesperado desde un bloque catch.
 * Omite automáticamente errores de validación (422), autenticación (401) y
 * autorización (403) porque ya tienen manejo propio en la UI.
 *
 * @param error   El error capturado en el catch
 * @param context Identificador del origen: "useNewSaleModal.addToCart"
 */
export const logUnexpectedError = (error: unknown, context: string): void => {
    if (isHandledError(error)) return;

    const meta    = getClientMeta();
    const message = error instanceof Error ? error.message : String(error);
    const stack   = error instanceof Error ? error.stack   : undefined;

    // Console en dev (a través de Winston para formato consistente)
    if (isDev) {
        logger.error(message, { context, stack, ...meta });
    }

    // Siempre enviar al backend (crea archivo por tenant en el servidor)
    sendToApi({
        message: message.slice(0, 1000),
        stack:   stack?.slice(0, 5000),
        context,
        url:     window.location.href,
        ...meta,
    });
};

export default logger;
