import { useEffect } from "react";
import { useQueryClient, QueryKey } from "@tanstack/react-query";
import { toast, ToastOptions } from "react-toastify";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import axiosApi from "@/configs/axiosConfig";
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
            // Los canales de órdenes ahora son privados (orders.{tenantId}) — Echo necesita
            // autenticar la suscripción contra el backend. `axiosApi` ya inyecta el Bearer
            // token vigente vía su interceptor (esta app no usa cookies de sesión), así que
            // un authorizer custom es más simple/confiable que el `auth.headers` default de
            // Echo, que fijaría el token al momento de construir el singleton en vez de
            // leerlo fresco en cada intento de suscripción.
            authorizer: (channel: { name: string }) => ({
                authorize: (socketId: string, callback: (error: Error | null, authData: { auth: string } | null) => void) => {
                    axiosApi
                        .post("/api/broadcasting/auth", { socket_id: socketId, channel_name: channel.name })
                        .then((response) => callback(null, response.data))
                        .catch((error) => callback(error, null));
                },
            }),
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
    /** tenant_id del usuario autenticado (useAxios().user?.tenant_id) — sin él no hay a qué
     * canal privado suscribirse, así que el hook no hace nada. */
    tenantId?: number | null;
    showToast?: boolean;
    suppressCreated?: boolean;
}

export const useOrdersSocket = ({ tenantId, showToast = false, suppressCreated = false }: UseOrdersSocketOptions = {}) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!tenantId) return;

        const toastHandlers: Record<string, ToastHandler | undefined> = {
            new_public_order: () => toast.info("📋 Nueva solicitud de pedido recibida", { ...TOAST_BASE, autoClose: 6000 }),
            created:          suppressCreated ? undefined : () => toast.info("Nuevo pedido recibido", TOAST_BASE),
            served:           () => toast.success("Orden servida", TOAST_BASE),
            restored_served:  () => toast.info("Orden actualizada", TOAST_BASE),
        };

        // Canal privado por tenant — antes era un Channel público único ("orders") compartido
        // por TODOS los tenants del servidor, así que cualquier negocio conectado recibía el
        // "Nuevo pedido recibido" de cualquier otro negocio (ver app/Events/OrdersUpdated.php).
        const channel = getEcho().private(`orders.${tenantId}`);

        const handler = (data: { type?: string }) => {
            // type: "all" — refetchQueries por defecto solo toca queries ACTIVAS (con un
            // componente montado observándolas). Si la orden se crea/actualiza mientras la
            // vista de Órdenes no está montada (ej. recién se navegó a TakeOrder), su query
            // queda cacheada con datos viejos y nunca se refresca hasta que algo más la
            // invalide — de ahí que solo se vieran las órdenes activas después de recargar
            // la página a mano.
            queryClient.refetchQueries({ predicate: (q) => isOrderQuery(q.queryKey), type: "all" });

            if (showToast && data.type) {
                toastHandlers[data.type]?.();
            }
        };

        channel.listen(EVENT, handler);

        return () => {
            channel.stopListening(EVENT, handler);
        };
    }, [queryClient, tenantId, showToast, suppressCreated]);
};
