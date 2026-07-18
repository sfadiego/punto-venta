import { useEffect } from "react";
import { useQueryClient, QueryKey } from "@tanstack/react-query";
import { toast, ToastOptions } from "react-toastify";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

let echoInstance: Echo<"reverb"> | null = null;

export const getEcho = (): Echo<"reverb"> => {
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
            enabledTransports: ["ws", "wss"],
        });
    }
    return echoInstance;
};

const EVENT = ".orders.updated";

const TOAST_BASE: ToastOptions = { position: "top-right", autoClose: 4000, pauseOnHover: true };

const ORDER_QUERY_KEYS = [
    "orders-infinite",
    ApiRoutes.Orders as string,
    "pending-orders",
];

const isOrderQuery = (key: QueryKey) =>
    ORDER_QUERY_KEYS.includes((key as unknown[])[0] as string);

type ToastHandler = () => void;

interface UseOrdersSocketOptions {
    showToast?: boolean;
    suppressCreated?: boolean;
}

export const useOrdersSocket = ({ showToast = false, suppressCreated = false }: UseOrdersSocketOptions = {}) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const toastHandlers: Record<string, ToastHandler | undefined> = {
            new_public_order: () => toast.info("📋 Nueva solicitud de pedido recibida", { ...TOAST_BASE, autoClose: 6000 }),
            created:          suppressCreated ? undefined : () => toast.info("Nuevo pedido recibido", TOAST_BASE),
            served:           () => toast.success("Orden servida", TOAST_BASE),
            restored_served:  () => toast.info("Orden actualizada", TOAST_BASE),
        };

        const channel = getEcho().channel("orders");

        const handler = (data: { type?: string }) => {
            queryClient.refetchQueries({ predicate: (q) => isOrderQuery(q.queryKey) });

            if (showToast && data.type) {
                toastHandlers[data.type]?.();
            }
        };

        channel.listen(EVENT, handler);

        return () => {
            channel.stopListening(EVENT, handler);
        };
    }, [queryClient, showToast, suppressCreated]);
};
