import { useState, useEffect, useRef } from "react";
import { searchAddress, INominatimResult } from "@/libs/nominatim";

export type { INominatimResult };

export const useAddressAutocomplete = (value: string) => {
    const [suggestions, setSuggestions] = useState<INominatimResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (value.length < 5) {
            setSuggestions([]);
            setOpen(false);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            if (abortRef.current) abortRef.current.abort();
            abortRef.current = new AbortController();

            setIsLoading(true);
            try {
                const data = await searchAddress(value, abortRef.current.signal);
                setSuggestions(data);
                setOpen(data.length > 0);
            } catch (error) {
                if (error instanceof Error && error.name !== "AbortError") {
                    console.error("[useAddressAutocomplete]", error);
                }
            } finally {
                setIsLoading(false);
            }
        }, 600);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [value]);

    const select = (result: INominatimResult, onSelect: (value: string) => void) => {
        setSuggestions([]);
        setOpen(false);
        onSelect(result.display_name);
    };

    return { suggestions, isLoading, open, setOpen, select };
};
