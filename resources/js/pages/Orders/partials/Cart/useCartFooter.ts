import { useState, useRef, useEffect } from "react";

export const useCartFooter = (
    orderDiscount: number,
    subtotal: number,
    onUpdateDiscount: (descuento: number) => Promise<void>,
) => {
    const [editing, setEditing] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const discountAmount = subtotal * (orderDiscount / 100);

    useEffect(() => {
        if (editing) {
            setInputValue(orderDiscount > 0 ? String(orderDiscount) : "");
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [editing, orderDiscount]);

    const applyDiscount = async () => {
        const val = Math.min(99, Math.max(0, parseInt(inputValue) || 0));
        setEditing(false);
        if (val !== orderDiscount) await onUpdateDiscount(val);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") applyDiscount();
        if (e.key === "Escape") setEditing(false);
    };

    const clearDiscount = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await onUpdateDiscount(0);
    };

    return {
        editing,
        setEditing,
        inputValue,
        setInputValue,
        inputRef,
        discountAmount,
        applyDiscount,
        handleKeyDown,
        clearDiscount,
    };
};
