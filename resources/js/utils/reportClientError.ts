interface ReportErrorOptions {
    message: string;
    stack?: string;
    context?: string;
}

export const reportClientError = ({ message, stack, context }: ReportErrorOptions): void => {
    const payload = JSON.stringify({
        message: message.slice(0, 1000),
        stack: stack?.slice(0, 5000),
        url: window.location.href,
        context,
        error_type: "client",
    });

    try {
        navigator.sendBeacon("/api/client-error", new Blob([payload], { type: "application/json" }));
    } catch {
        // sendBeacon no disponible — ignorar silenciosamente
    }
};
