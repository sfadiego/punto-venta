import { useEffect } from "react";
import { useAxios } from "@/hooks/useAxios";
import { getEcho } from "@/hooks/useOrdersSocket";

const EVENT = ".tenant.session-revoked";

/**
 * Cierra sesión al instante cuando el SuperAdmin desactiva o borra el negocio. Escucha en el canal privado
 * `orders.{tenantId}`, el mismo de useOrdersSocket. Es un complemento: si el WebSocket no está disponible,
 * la sesión se cierra igual en la siguiente petición (401 o TENANT_INACTIVE, ver AxiosContext).
 */
export const useTenantSessionSocket = (tenantId?: number | null) => {
    const { logout } = useAxios();

    useEffect(() => {
        if (!tenantId) return;

        const channel = getEcho().private(`orders.${tenantId}`);
        channel.listen(EVENT, logout);

        return () => {
            channel.stopListening(EVENT, logout);
        };
    }, [tenantId, logout]);
};
