import axios from "axios";
import axiosApi from "@/configs/axiosConfig";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

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

const sendToApi = (payload: ApiLogPayload): void => {
    axiosApi.post(ApiRoutes.ClientErrorLog, payload).catch(() => {
        navigator.sendBeacon(
            ApiRoutes.ClientErrorLog,
            JSON.stringify({
                message: payload.message,
                stack: payload.stack,
                url: payload.url,
            }),
        );
    });
};

const SKIPPED_STATUSES = new Set([401, 403]);

const isHandledError = (error: unknown): boolean => {
    if (!axios.isAxiosError(error)) return false;
    const status = error.response?.status;
    return status !== undefined && SKIPPED_STATUSES.has(status);
};

export const logUnexpectedError = (error: unknown, context: string): void => {
    if (isHandledError(error)) return;

    const meta = getClientMeta();
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    if (isDev) {
        console.error(
            `[${new Date().toLocaleTimeString()}] ERROR [${context}] ${message}`,
            { stack, ...meta },
        );
    }

    sendToApi({
        message: message.slice(0, 1000),
        stack: stack?.slice(0, 5000),
        context,
        url: window.location.href,
        ...meta,
    });
};
