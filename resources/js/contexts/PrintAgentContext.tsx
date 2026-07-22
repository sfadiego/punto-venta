import { createContext, useCallback, useEffect, useRef, useState } from "react";

const AGENT_URL       = "ws://localhost:8765";
const RECONNECT_DELAY = 5000;

interface PrintAgentContextType {
    isConnected: boolean;
    print: (bytes: Uint8Array) => Promise<void>;
}

export const PrintAgentContext = createContext<PrintAgentContextType>({
    isConnected: false,
    print: () => Promise.reject(new Error("PrintAgentProvider no montado")),
});

interface PrintAgentProviderProps {
    children: React.ReactNode;
    enabled?: boolean;
}

export const PrintAgentProvider = ({ children, enabled = false }: PrintAgentProviderProps) => {
    const ws              = useRef<WebSocket | null>(null);
    const reconnectTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingResolvers= useRef<Array<{ resolve: () => void; reject: (e: Error) => void }>>([]);
    const [isConnected, setIsConnected] = useState(false);

    const disconnect = useCallback(() => {
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        ws.current?.close();
        ws.current = null;
    }, []);

    const connect = useCallback(() => {
        if (ws.current?.readyState === WebSocket.OPEN) return;

        const socket = new WebSocket(AGENT_URL);
        ws.current = socket;

        socket.onopen = () => {
            setIsConnected(true);
        };

        socket.onmessage = (event) => {
            try {
                const res = JSON.parse(event.data as string) as { ok: boolean; error?: string };
                const resolver = pendingResolvers.current.shift();
                if (!resolver) return;
                if (res.ok) {
                    resolver.resolve();
                } else {
                    resolver.reject(new Error(res.error ?? "Error al imprimir"));
                }
            } catch {
                // ignorar mensajes inesperados
            }
        };

        socket.onclose = () => {
            setIsConnected(false);
            pendingResolvers.current.forEach(({ reject }) =>
                reject(new Error("Agente desconectado"))
            );
            pendingResolvers.current = [];
            reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
        };

        socket.onerror = () => {
            // onclose se dispara inmediatamente después
        };
    }, []);

    useEffect(() => {
        if (!enabled) {
            disconnect();
            return;
        }
        connect();
        return () => disconnect();
    }, [enabled, connect, disconnect]);

    const print = useCallback((bytes: Uint8Array): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
                return reject(new Error("Agente de impresión no conectado"));
            }
            pendingResolvers.current.push({ resolve, reject });
            ws.current.send(bytes as Uint8Array<ArrayBuffer>);
        });
    }, []);

    return (
        <PrintAgentContext.Provider value={{ isConnected, print }}>
            {children}
        </PrintAgentContext.Provider>
    );
};
