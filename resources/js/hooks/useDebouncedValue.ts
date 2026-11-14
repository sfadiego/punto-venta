import { useEffect, useState } from "react";

// Devuelve `value` solo después de que deja de cambiar durante `delayMs` (para no pedir al servidor en cada tecla).
export const useDebouncedValue = <T>(value: T, delayMs = 400): T => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debouncedValue;
};
