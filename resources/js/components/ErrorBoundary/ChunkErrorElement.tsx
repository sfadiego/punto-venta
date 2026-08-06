import { useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { reportClientError } from "@/utils/reportClientError";

const RELOAD_FLAG_KEY = "chunk-error-reload-at";
const RELOAD_COOLDOWN_MS = 10_000;

const CHUNK_ERROR_PATTERN = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

const getErrorMessage = (error: unknown): string => {
    if (isRouteErrorResponse(error)) return error.statusText;
    if (error instanceof Error) return error.message;
    return String(error);
};

// React Router (data router) captura los errores lanzados dentro de una ruta con su propia
// pantalla ("Unexpected Application Error") antes de que lleguen a cualquier ErrorBoundary de
// React fuera de <RouterProvider>. Por eso el manejo de chunks obsoletos post-deploy debe ir
// como errorElement de las rutas, no como boundary externo (ver ChunkErrorBoundary, que sigue
// cubriendo errores fuera del árbol de rutas).
export const ChunkErrorElement = () => {
    const error = useRouteError();
    const isChunkError = CHUNK_ERROR_PATTERN.test(getErrorMessage(error));

    useEffect(() => {
        if (isChunkError) {
            const lastReloadAt = Number(sessionStorage.getItem(RELOAD_FLAG_KEY) ?? 0);
            const now = Date.now();
            if (now - lastReloadAt >= RELOAD_COOLDOWN_MS) {
                sessionStorage.setItem(RELOAD_FLAG_KEY, String(now));
                window.location.reload();
            }
            return;
        }

        reportClientError({
            message: getErrorMessage(error),
            stack: error instanceof Error ? error.stack : undefined,
            context: "ChunkErrorElement",
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isChunkError]);

    if (isChunkError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-stone-50">
                <div className="flex flex-col items-center gap-3 text-stone-500">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <p>Actualizando aplicación...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-stone-50">
            <div className="flex flex-col items-center gap-3 text-stone-500">
                <p>Ocurrió un error inesperado.</p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 rounded-md bg-amber-500 text-white hover:bg-amber-600"
                >
                    Recargar
                </button>
            </div>
        </div>
    );
};
