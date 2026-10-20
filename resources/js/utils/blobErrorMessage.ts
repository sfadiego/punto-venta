import { getUserFacingErrorMessage, isAxiosError } from "@/utils/axiosError";

const TOO_MANY_REQUESTS_STATUS = 429;

// Las descargas piden `responseType: "blob"`, así que el cuerpo de un error llega como Blob y hay que leerlo
// para obtener el mensaje del backend.
export const getBlobErrorMessage = async (error: unknown): Promise<string> => {
    if (!isAxiosError(error)) return "Error inesperado al descargar";
    if (!error.response) return getUserFacingErrorMessage(error, "Error inesperado al descargar");

    // El límite de descargas por minuto (throttle) lo responde Laravel en inglés ("Too Many Attempts.").
    if (error.response.status === TOO_MANY_REQUESTS_STATUS) {
        return "Demasiadas descargas seguidas. Espera un minuto e intenta de nuevo.";
    }

    const data = error.response.data;
    if (data instanceof Blob) {
        try {
            const json = JSON.parse(await data.text()) as { message?: string };
            return json.message ?? "Error del servidor";
        } catch {
            return "Error del servidor";
        }
    }
    return (data as { message?: string })?.message ?? "Error del servidor";
};
