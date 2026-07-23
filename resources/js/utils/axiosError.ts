import { isAxiosError } from "axios";

export { isAxiosError };

// True when a mutation failed because the target order_product was already
// deleted by another in-flight request (race between rapid add/remove clicks).
export const isItemAlreadyRemovedError = (error: unknown): boolean =>
    isAxiosError(error) &&
    error.response?.status === 422 &&
    error.response?.data?.message === "elemento no encontrado";
