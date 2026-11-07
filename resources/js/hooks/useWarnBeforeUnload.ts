import { useEffect } from "react";

// Con `active`, el navegador pide confirmación antes de cerrar o recargar la pestaña (los
// cambios que solo viven en memoria se perderían). No envía nada: solo avisa.
export const useWarnBeforeUnload = (active: boolean) => {
    useEffect(() => {
        if (!active) return;

        const warn = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [active]);
};
