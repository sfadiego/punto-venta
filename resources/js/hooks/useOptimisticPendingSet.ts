import { useRef, useState } from "react";

// Shared guard for the "click twice before the request settles" race: a
// synchronous `Set` (via ref) decides in-flight membership immediately,
// while the mirrored state re-render drives UI (spinners/disabled buttons).
// Pattern used by useTakeOrder and useOrderPreviewModal — see CLAUDE.md.
export const useOptimisticPendingSet = <T = number>() => {
    const pendingRef = useRef(new Set<T>());
    const [pendingIds, setPendingIds] = useState<Set<T>>(new Set());

    const isPending = (id: T) => pendingRef.current.has(id);

    const withPending = async <R>(ids: T[], fn: () => Promise<R>): Promise<R> => {
        ids.forEach((id) => pendingRef.current.add(id));
        setPendingIds(new Set(pendingRef.current));
        try {
            return await fn();
        } finally {
            ids.forEach((id) => pendingRef.current.delete(id));
            setPendingIds(new Set(pendingRef.current));
        }
    };

    return { pendingIds, isPending, withPending };
};
