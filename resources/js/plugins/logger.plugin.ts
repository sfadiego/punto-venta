import axios from "axios";
import axiosApi from "@/configs/axiosConfig";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

interface ClientMeta {
    tenant_slug: string;
    user_id: number | null;
    usuario: string;
}

type ClientErrorType = "network" | "timeout" | "http" | "client";

interface ApiLogPayload {
    message: string;
    stack?: string;
    context: string;
    url: string;
    tenant_slug: string;
    user_id: number | null;
    usuario: string;
    error_type: ClientErrorType;
    error_code: string | null;
    failed_endpoint: string | null;
    failed_method: string | null;
    failed_status: number | null;
}

const isDev = import.meta.env.VITE_APP_ENV === "local";

const getClientMeta = (): ClientMeta => {
    try {
        const raw = localStorage.getItem("user");
        const user = raw ? (JSON.parse(raw) as { id?: number; usuario?: string }) : null;
        return {
            tenant_slug: localStorage.getItem("tenantSlug") ?? "unknown",
            user_id: user?.id ?? null,
            usuario: user?.usuario ?? "unknown",
        };
    } catch {
        return { tenant_slug: "unknown", user_id: null, usuario: "unknown" };
    }
};

const sendBeaconPayload = (payload: ApiLogPayload): boolean => {
    try {
        return navigator.sendBeacon(
            ApiRoutes.ClientErrorLog,
            new Blob([JSON.stringify(payload)], { type: "application/json" }),
        );
    } catch {
        return false;
    }
};

const sendToApi = (payload: ApiLogPayload): void => {
    // Los errores de red/timeout ocurrieron con la conexión ya degradada: un segundo
    // POST por axios corre el mismo riesgo de colgarse o fallar en silencio, así que
    // se usa sendBeacon primero (fire-and-forget, sobrevive el cierre de la pestaña).
    if (payload.error_type === "network" || payload.error_type === "timeout") {
        if (sendBeaconPayload(payload)) return;
    }

    axiosApi.post(ApiRoutes.ClientErrorLog, payload).catch(() => {
        sendBeaconPayload(payload);
    });
};

const SKIPPED_STATUSES = new Set([401, 403]);

const isHandledError = (error: unknown): boolean => {
    if (!axios.isAxiosError(error)) return false;
    const status = error.response?.status;
    return status !== undefined && SKIPPED_STATUSES.has(status);
};

const TIMEOUT_CODES = new Set(["ECONNABORTED", "ETIMEDOUT"]);

const getErrorType = (error: unknown): ClientErrorType => {
    if (!axios.isAxiosError(error)) return "client";
    if (error.code && TIMEOUT_CODES.has(error.code)) return "timeout";
    if (!error.response) return "network";
    return "http";
};

const getAxiosMeta = (error: unknown) => {
    if (!axios.isAxiosError(error)) {
        return { error_code: null, failed_endpoint: null, failed_method: null, failed_status: null };
    }
    return {
        error_code: error.code ?? null,
        failed_endpoint: error.config?.url ?? null,
        failed_method: error.config?.method?.toUpperCase() ?? null,
        failed_status: error.response?.status ?? null,
    };
};

export const logUnexpectedError = (error: unknown, context: string): void => {
    if (isHandledError(error)) return;

    const meta = getClientMeta();
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    const errorType = getErrorType(error);
    const axiosMeta = getAxiosMeta(error);

    if (isDev) {
        console.error(
            `[${new Date().toLocaleTimeString()}] ERROR [${context}] (${errorType}) ${message}`,
            { stack, ...meta, ...axiosMeta },
        );
    }

    sendToApi({
        message: message.slice(0, 1000),
        stack: stack?.slice(0, 5000),
        context,
        url: window.location.href,
        error_type: errorType,
        ...axiosMeta,
        ...meta,
    });
};
