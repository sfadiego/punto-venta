import { isAxiosError } from "axios";

export { isAxiosError };

// True when a mutation failed because the target order_product was already
// deleted by another in-flight request (race between rapid add/remove clicks).
export const isItemAlreadyRemovedError = (error: unknown): boolean =>
    isAxiosError(error) &&
    error.response?.status === 422 &&
    error.response?.data?.message === "elemento no encontrado";

const TIMEOUT_CODES = new Set(["ECONNABORTED", "ETIMEDOUT"]);

// Devuelve un mensaje entendible para el usuario, distinguiendo errores de
// conectividad (sin response del servidor) de errores de negocio (con mensaje del backend).
export const getUserFacingErrorMessage = (error: unknown, fallback: string): string => {
    if (!isAxiosError(error)) return fallback;

    if (error.code === "ERR_NETWORK") {
        return "Sin conexión a internet. Verifica tu red e intenta de nuevo.";
    }
    if (error.code && TIMEOUT_CODES.has(error.code)) {
        return "La solicitud tardó demasiado en responder. Verifica tu conexión e intenta de nuevo.";
    }

    return error.response?.data?.message ?? fallback;
};
