import { isAxiosError } from "axios";

export { isAxiosError };

// True when a mutation failed because the target order_product was already
// deleted by another in-flight request (race between rapid add/remove clicks).
export const isItemAlreadyRemovedError = (error: unknown): boolean =>
    isAxiosError(error) &&
    error.response?.status === 422 &&
    error.response?.data?.message === "elemento no encontrado";

// True cuando la orden ya no existe para este tenant (borrada desde otra
// terminal/pestaña, o soft-deleted) — el route-model binding de Laravel
// responde 404 automáticamente antes de llegar al controller. Es un
// resultado esperado de un POS multi-terminal, no un error a reportar.
export const isOrderNotFoundError = (error: unknown): boolean =>
    isAxiosError(error) && error.response?.status === 404;

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

    if (error.response?.data?.message) return error.response.data.message;

    // Errores de validación (bootstrap/app.php withExceptions -> ValidationException) responden
    // {success: false, data: {campo: ["mensaje"]}} sin "message" top-level — sin este fallback,
    // getUserFacingErrorMessage siempre devolvía el texto genérico del caller, ocultando el
    // motivo real (ej. "The cantidad field must not be greater than 99.").
    const validationErrors = getFieldErrors(error);
    const firstFieldError = validationErrors && Object.values(validationErrors)[0];
    if (firstFieldError) return firstFieldError;

    return fallback;
};

// Extrae errores de validación por campo (400, {data: {campo: [mensaje]}}) para
// pasarlos a formik.setErrors — el componente Input ya sabe pintar formik.errors[name].
// Devuelve null si el error no trae ese formato (ej. error de red, 401, 500).
export const getFieldErrors = (error: unknown): Record<string, string> | null => {
    if (!isAxiosError<{ data?: Record<string, string[] | string> }>(error)) return null;

    const fieldErrors = error.response?.data?.data;
    if (!fieldErrors) return null;

    const errors: Record<string, string> = {};
    Object.entries(fieldErrors).forEach(([field, message]) => {
        errors[field] = Array.isArray(message) ? message[0] : message;
    });
    return errors;
};
