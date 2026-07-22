//valida la respuesta de la api con mutateAsync: tanstack
import { UseMutateAsyncFunction } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { toast } from "react-toastify";
import { logUnexpectedError } from "@/plugins/logger.plugin";

type ApiError = { response?: { data?: { data?: Record<string, string>; message?: string } } };

export const useOnSubmit = <Request = unknown, Response = unknown>({
    mutateAsync,
    onSuccess,
    onError,
}: {
    mutateAsync: UseMutateAsyncFunction<AxiosResponse<Response>, Error, Request>;
    onSuccess: (data: Response) => void;
    onError?: (data: Error) => void;
}) => {
    const onSubmit = async (data: Request, { setErrors }: { setErrors: (errors: Record<string, string>) => void }) => {
        try {
            const res = await mutateAsync(data);
            onSuccess(res.data);
        } catch (error: unknown) {
            const apiError = error as ApiError;
            if (apiError.response?.data?.data != null) {
                setErrors(apiError.response.data.data);
            } else if (onError) {
                onError(error as Error);
            } else {
                logUnexpectedError(error, "useOnSubmit");
                toast.error(apiError.response?.data?.message ?? "Error inesperado");
            }
        }
    };

    return {
        onSubmit,
    };
};
