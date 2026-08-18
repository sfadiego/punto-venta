interface ReportErrorOptions {
    message: string;
    stack?: string;
    context?: string;
}

export const reportClientError = ({ message, stack, context }: ReportErrorOptions): void => {
    const payload = JSON.stringify({
        message: message.slice(0, 1000),
        // 5000 truncaba stacks minificados dejando solo los frames genéricos del scheduler de
        // React (todos idénticos entre incidentes) y perdiendo los frames que sí identifican
        // el chunk/componente que disparó el error — ver incidente #185 en /customers.
        stack: stack?.slice(0, 20000),
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
