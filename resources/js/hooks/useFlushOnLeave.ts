import { useEffect, useRef } from "react";

// Envía los cambios pendientes del carrito cuando la página se oculta (cambio de app, pantalla
// bloqueada) o se descarga: en móvil el navegador puede pausar los temporizadores o matar la
// pestaña antes de que se cumpla el debounce. Al cerrar o recargar, además, avisa si quedan
// cambios sin enviar.
export const useFlushOnLeave = (hasPending: boolean, flushPending: () => Promise<unknown>) => {
    const latest = useRef({ hasPending, flushPending });
    latest.current = { hasPending, flushPending };

    useEffect(() => {
        const flush = () => void latest.current.flushPending();
        const flushIfHidden = () => {
            if (document.visibilityState === "hidden") flush();
        };
        const warnBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!latest.current.hasPending) return;
            event.preventDefault();
            flush();
        };

        document.addEventListener("visibilitychange", flushIfHidden);
        window.addEventListener("pagehide", flush);
        window.addEventListener("beforeunload", warnBeforeUnload);
        return () => {
            document.removeEventListener("visibilitychange", flushIfHidden);
            window.removeEventListener("pagehide", flush);
            window.removeEventListener("beforeunload", warnBeforeUnload);
        };
    }, []);
};
