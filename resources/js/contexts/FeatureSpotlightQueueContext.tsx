import { createContext, useCallback, useContext, useState } from "react";

interface IFeatureSpotlightQueueContext {
    activeKey: string | null;
    register: (key: string) => void;
    unregister: (key: string) => void;
}

export const FeatureSpotlightQueueContext = createContext<IFeatureSpotlightQueueContext>({
    activeKey: null,
    register: () => {},
    unregister: () => {},
});

export const useFeatureSpotlightQueue = () => useContext(FeatureSpotlightQueueContext);

interface FeatureSpotlightQueueProviderProps {
    children: React.ReactNode;
}

/** Asegura que solo se muestre un FeatureSpotlight a la vez en toda la app — el resto espera en cola por orden de montaje. */
export const FeatureSpotlightQueueProvider = ({ children }: FeatureSpotlightQueueProviderProps) => {
    const [queue, setQueue] = useState<string[]>([]);

    const register = useCallback((key: string) => {
        setQueue((prev) => (prev.includes(key) ? prev : [...prev, key]));
    }, []);

    const unregister = useCallback((key: string) => {
        setQueue((prev) => prev.filter((queuedKey) => queuedKey !== key));
    }, []);

    return (
        <FeatureSpotlightQueueContext.Provider value={{ activeKey: queue[0] ?? null, register, unregister }}>
            {children}
        </FeatureSpotlightQueueContext.Provider>
    );
};
