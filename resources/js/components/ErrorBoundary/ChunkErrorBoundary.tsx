import React, { Component, ReactNode } from "react";
import { reportClientError } from "@/utils/reportClientError";

const RELOAD_FLAG_KEY = "chunk-error-reload-at";
const RELOAD_COOLDOWN_MS = 10_000;

const CHUNK_ERROR_PATTERN = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

interface ChunkErrorBoundaryProps {
    children: ReactNode;
}

interface ChunkErrorBoundaryState {
    hasChunkError: boolean;
    hasOtherError: boolean;
}

// Vite dispara "vite:preloadError" (ver main.tsx) cuando un import() dinámico falla tras un deploy,
// pero ese evento no cubre todos los navegadores (ej. Safari lanza el error directo al render).
// Este boundary es el respaldo: detecta el mismo tipo de error por su mensaje y recarga la página.
export class ChunkErrorBoundary extends Component<ChunkErrorBoundaryProps, ChunkErrorBoundaryState> {
    state: ChunkErrorBoundaryState = { hasChunkError: false, hasOtherError: false };

    static getDerivedStateFromError(error: Error): ChunkErrorBoundaryState {
        if (CHUNK_ERROR_PATTERN.test(error.message)) {
            return { hasChunkError: true, hasOtherError: false };
        }
        return { hasChunkError: false, hasOtherError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        if (!this.state.hasChunkError) {
            reportClientError({ message: error.message, stack: error.stack ?? info.componentStack ?? undefined, context: "ChunkErrorBoundary" });
            return;
        }

        const lastReloadAt = Number(sessionStorage.getItem(RELOAD_FLAG_KEY) ?? 0);
        const now = Date.now();
        if (now - lastReloadAt < RELOAD_COOLDOWN_MS) return;

        sessionStorage.setItem(RELOAD_FLAG_KEY, String(now));
        window.location.reload();
    }

    render(): ReactNode {
        if (this.state.hasChunkError) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-stone-50">
                    <div className="flex flex-col items-center gap-3 text-stone-500">
                        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <p>Actualizando aplicación...</p>
                    </div>
                </div>
            );
        }

        if (this.state.hasOtherError) {
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
        }

        return this.props.children;
    }
}
