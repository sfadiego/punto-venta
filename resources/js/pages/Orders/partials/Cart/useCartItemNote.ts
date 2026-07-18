import { useState, useEffect } from "react";

export const useCartItemNote = (
    initialNote: string | null,
    onSave: (note: string) => Promise<void>,
) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialNote ?? "");
    const [isPending, setIsPending] = useState(false);

    useEffect(() => {
        if (!isEditing) setValue(initialNote ?? "");
    }, [initialNote, isEditing]);

    const open = () => {
        setValue(initialNote ?? "");
        setIsEditing(true);
    };

    const cancel = () => {
        setValue(initialNote ?? "");
        setIsEditing(false);
    };

    const save = async () => {
        setIsPending(true);
        try {
            await onSave(value.trim());
            setIsEditing(false);
        } finally {
            setIsPending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") { e.preventDefault(); save(); }
        if (e.key === "Escape") cancel();
    };

    return { isEditing, value, isPending, open, cancel, save, setValue, handleKeyDown };
};
