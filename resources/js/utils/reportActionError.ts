import { toast } from "react-toastify";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

// Registra el error inesperado y avisa al usuario con un toast (mensaje del backend o `fallback`).
export const reportActionError = (error: unknown, context: string, fallback: string): void => {
    logUnexpectedError(error, context);
    toast.error(getUserFacingErrorMessage(error, fallback));
};
