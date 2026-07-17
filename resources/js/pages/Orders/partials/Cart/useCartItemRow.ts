import { useState, useRef, useEffect } from "react";
import { CartItem } from "../../useTakeOrder";

export const useCartItemRow = (
    item: CartItem,
    onUpdateProductDiscount: (productId: number, descuento: number) => Promise<void>,
) => {
    const [editingDiscount, setEditingDiscount] = useState(false);
    const [discountInput, setDiscountInput] = useState("");
    const discountInputRef = useRef<HTMLInputElement>(null);

    const itemTotal = item.price * item.quantity * (1 - item.descuento / 100);
    const canDiscount = !item.isExtra && item.id !== null;

    useEffect(() => {
        if (editingDiscount) {
            setDiscountInput(item.descuento > 0 ? String(item.descuento) : "");
            discountInputRef.current?.focus();
            discountInputRef.current?.select();
        }
    }, [editingDiscount, item.descuento]);

    const applyProductDiscount = async () => {
        const val = Math.min(99, Math.max(0, parseInt(discountInput) || 0));
        setEditingDiscount(false);
        if (val !== item.descuento && item.id !== null) await onUpdateProductDiscount(item.id, val);
    };

    const handleDiscountKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") applyProductDiscount();
        if (e.key === "Escape") setEditingDiscount(false);
    };

    const clearProductDiscount = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (item.id !== null) await onUpdateProductDiscount(item.id, 0);
    };

    return {
        editingDiscount,
        setEditingDiscount,
        discountInput,
        setDiscountInput,
        discountInputRef,
        itemTotal,
        canDiscount,
        applyProductDiscount,
        handleDiscountKeyDown,
        clearProductDiscount,
    };
};
