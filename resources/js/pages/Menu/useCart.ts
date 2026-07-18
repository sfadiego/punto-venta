import { useState } from "react";
import { IMenuProduct, ICartItem } from "@/models/IMenu";
import { isWeightUnit, weightStep, weightMin } from "@/utils/weightUnits";

export type { ICartItem };

const round3 = (n: number) => parseFloat(n.toFixed(3));

export const useCart = () => {
    const [items, setItems] = useState<ICartItem[]>([]);

    const add = (product: IMenuProduct) => {
        const unit = product.unidad_medida;
        const step = isWeightUnit(unit) ? weightStep(unit) : 1;

        setItems((prev) => {
            const existing = prev.find((i) => i.product.id === product.id);
            if (existing) {
                return prev.map((i) =>
                    i.product.id === product.id
                        ? { ...i, cantidad: round3(i.cantidad + step) }
                        : i
                );
            }
            return [...prev, { product, cantidad: step, observacion: null }];
        });
    };

    const remove = (productId: number) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.product.id === productId);
            if (!existing) return prev;

            const unit = existing.product.unidad_medida;
            const step = isWeightUnit(unit) ? weightStep(unit) : 1;
            const min = isWeightUnit(unit) ? weightMin(unit) : 1;
            const newQty = round3(existing.cantidad - step);

            if (newQty < min) return prev.filter((i) => i.product.id !== productId);
            return prev.map((i) =>
                i.product.id === productId ? { ...i, cantidad: newQty } : i
            );
        });
    };

    const setWeight = (productId: number, weight: number) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.product.id === productId);
            if (!existing) return prev;
            const min = isWeightUnit(existing.product.unidad_medida)
                ? weightMin(existing.product.unidad_medida)
                : 1;
            if (weight < min) return prev.filter((i) => i.product.id !== productId);
            return prev.map((i) =>
                i.product.id === productId ? { ...i, cantidad: round3(weight) } : i
            );
        });
    };

    const setNote = (productId: number, note: string) => {
        setItems((prev) =>
            prev.map((i) =>
                i.product.id === productId
                    ? { ...i, observacion: note.trim() || null }
                    : i
            )
        );
    };

    const deleteItem = (productId: number) =>
        setItems((prev) => prev.filter((i) => i.product.id !== productId));

    const clear = () => setItems([]);

    const quantityOf = (productId: number) =>
        items.find((i) => i.product.id === productId)?.cantidad ?? 0;

    const total = items.reduce((sum, i) => sum + Number(i.product.precio) * i.cantidad, 0);

    const count = items.reduce((sum, i) => {
        return isWeightUnit(i.product.unidad_medida) ? sum + 1 : sum + i.cantidad;
    }, 0);

    return { items, add, remove, deleteItem, setWeight, clear, quantityOf, total, count, setNote };
};
