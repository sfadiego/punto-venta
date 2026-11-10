import { useEffect, useRef } from "react";

interface IUseInfiniteScrollSentinelParams {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => unknown;
}

// Scroll infinito: devuelve el ref que se pone en un elemento al final de la lista; cuando ese
// elemento entra en pantalla pide la página siguiente.
export const useInfiniteScrollSentinel = ({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
}: IUseInfiniteScrollSentinelParams) => {
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return sentinelRef;
};
