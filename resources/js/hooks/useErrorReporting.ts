import { useEffect } from "react";
import axios from "axios";
import { reportClientError } from "@/utils/reportClientError";

const sendError = (message: string, stack?: string) => {
    reportClientError({ message, stack });
};

export const useErrorReporting = () => {
    useEffect(() => {
        const onUnhandledRejection = (e: PromiseRejectionEvent) => {
            const error = e.reason;
            if (axios.isAxiosError(error)) return; // Los errores HTTP ya los captura el middleware
            sendError(error?.message ?? String(error), error?.stack);
        };

        const onError = (_msg: Event | string, _src?: string, _line?: number, _col?: number, error?: Error) => {
            sendError(error?.message ?? String(_msg), error?.stack);
        };

        window.addEventListener("unhandledrejection", onUnhandledRejection);
        window.addEventListener("error", onError as EventListener);

        return () => {
            window.removeEventListener("unhandledrejection", onUnhandledRejection);
            window.removeEventListener("error", onError as EventListener);
        };
    }, []);
};
