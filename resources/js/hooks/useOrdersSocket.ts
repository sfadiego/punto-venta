import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

let echoInstance: Echo<"reverb"> | null = null;

const getEcho = (): Echo<"reverb"> => {
    if (!echoInstance) {
        const tls = (import.meta.env.VITE_REVERB_SCHEME ?? "http") === "https";
        (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;
        echoInstance = new Echo({
            broadcaster: "reverb",
            key: import.meta.env.VITE_REVERB_APP_KEY as string,
            wsHost: import.meta.env.VITE_REVERB_HOST as string,
            wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 6001),
            wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 6001),
            forceTLS: tls,
            enabledTransports: tls ? ["wss"] : ["ws"],
        });
    }
    return echoInstance;
};

const EVENT = ".orders.updated";

interface UseOrdersSocketOptions {
    showToast?: boolean;
}

export const useOrdersSocket = ({ showToast = false }: UseOrdersSocketOptions = {}) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const echo    = getEcho();
        const channel = echo.channel("orders");

        const handler = (data: { type?: string }) => {
            queryClient.refetchQueries({
                predicate: (query) => {
                    const key = query.queryKey as unknown[];
                    return (
                        key[0] === "orders-infinite" ||
                        key[0] === (ApiRoutes.Orders as string)
                    );
                },
            });

            if (showToast && data?.type === "created") {
                toast.info("Nuevo pedido recibido", {
                    position: "top-right",
                    autoClose: 4000,
                    pauseOnHover: true,
                });
            }
        };

        channel.listen(EVENT, handler);

        return () => {
            channel.stopListening(EVENT, handler);
        };
    }, [queryClient, showToast]);
};
