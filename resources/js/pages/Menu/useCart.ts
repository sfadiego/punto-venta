import { useState } from "react";
import { IMenuProduct } from "@/services/useMenuService";

export interface ICartItem {
    product: IMenuProduct;
    cantidad: number;
}

export const useCart = () => {
    const [items, setItems] = useState<ICartItem[]>([]);

    const add = (product: IMenuProduct) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.product.id === product.id);
            if (existing) {
                return prev.map((i) =>
                    i.product.id === product.id ? { ...i, cantidad: i.cantidad + 1 } : i
                );
            }
            return [...prev, { product, cantidad: 1 }];
        });
    };

    const remove = (productId: number) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.product.id === productId);
            if (!existing) return prev;
            if (existing.cantidad === 1) return prev.filter((i) => i.product.id !== productId);
            return prev.map((i) =>
                i.product.id === productId ? { ...i, cantidad: i.cantidad - 1 } : i
            );
        });
    };

    const clear = () => setItems([]);

    const quantityOf = (productId: number) =>
        items.find((i) => i.product.id === productId)?.cantidad ?? 0;

    const total = items.reduce((sum, i) => sum + Number(i.product.precio) * i.cantidad, 0);

    const count = items.reduce((sum, i) => sum + i.cantidad, 0);

    return { items, add, remove, clear, quantityOf, total, count };
};
