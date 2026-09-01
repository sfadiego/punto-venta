import { useState } from "react";
import { IMenuProduct, ICartItem } from "@/models/IMenu";
import { IProductVariant } from "@/models/IProductVariant";
import { isWeightUnit, weightStep, weightMin } from "@/utils/weightUnits";
import { getAvailableStockFor } from "@/utils/stock";
import { getCartItemUnitPrice, roundCartQuantity as round3, matchesCartLine as matchesLine } from "@/utils/menuCartCalc";

export type { ICartItem };

export const useCart = () => {
    const [items, setItems] = useState<ICartItem[]>([]);

    // Respaldo silencioso: en flujo normal ProductCard ya deshabilita sus controles al llegar
    // al tope de stock, así que este bloque no debería alcanzarse — mismo patrón que
    // useQuickSaleCart.addToCart.
    const add = (product: IMenuProduct, variant?: IProductVariant) => {
        const unit = product.unidad_medida;
        const step = isWeightUnit(unit) ? weightStep(unit) : 1;
        const variantId = variant?.id ?? null;
        const availableStock = getAvailableStockFor(product, variantId);

        setItems((prev) => {
            const existing = prev.find((i) => matchesLine(i, product.id, variantId));
            const currentQty = existing?.cantidad ?? 0;
            if (currentQty + step > availableStock) return prev;

            if (existing) {
                return prev.map((i) =>
                    matchesLine(i, product.id, variantId)
                        ? { ...i, cantidad: round3(i.cantidad + step) }
                        : i
                );
            }
            return [...prev, { product, variant: variant ?? null, cantidad: step, observacion: null }];
        });
    };

    const remove = (productId: number, variantId?: number | null) => {
        setItems((prev) => {
            const existing = prev.find((i) => matchesLine(i, productId, variantId));
            if (!existing) return prev;

            const unit = existing.product.unidad_medida;
            const step = isWeightUnit(unit) ? weightStep(unit) : 1;
            const min = isWeightUnit(unit) ? weightMin(unit) : 1;
            const newQty = round3(existing.cantidad - step);

            if (newQty < min) return prev.filter((i) => !matchesLine(i, productId, variantId));
            return prev.map((i) =>
                matchesLine(i, productId, variantId) ? { ...i, cantidad: newQty } : i
            );
        });
    };

    const setWeight = (productId: number, weight: number) => {
        setItems((prev) => {
            const existing = prev.find((i) => matchesLine(i, productId, null));
            if (!existing) return prev;
            const min = isWeightUnit(existing.product.unidad_medida)
                ? weightMin(existing.product.unidad_medida)
                : 1;
            if (weight < min) return prev.filter((i) => !matchesLine(i, productId, null));
            if (weight > getAvailableStockFor(existing.product, null)) return prev;
            return prev.map((i) =>
                matchesLine(i, productId, null) ? { ...i, cantidad: round3(weight) } : i
            );
        });
    };

    const setNote = (productId: number, note: string, variantId?: number | null) => {
        setItems((prev) =>
            prev.map((i) =>
                matchesLine(i, productId, variantId)
                    ? { ...i, observacion: note.trim() || null }
                    : i
            )
        );
    };

    const addWithWeight = (product: IMenuProduct, weight: number) => {
        const availableStock = getAvailableStockFor(product, null);
        if (weight > availableStock) return;

        setItems((prev) => {
            const existing = prev.find((i) => matchesLine(i, product.id, null));
            if (existing) {
                return prev.map((i) =>
                    matchesLine(i, product.id, null) ? { ...i, cantidad: round3(weight) } : i
                );
            }
            return [...prev, { product, variant: null, cantidad: round3(weight), observacion: null }];
        });
    };

    const deleteItem = (productId: number, variantId?: number | null) =>
        setItems((prev) => prev.filter((i) => !matchesLine(i, productId, variantId)));

    const clear = () => setItems([]);

    const quantityOf = (productId: number, variantId?: number | null) =>
        items.find((i) => matchesLine(i, productId, variantId))?.cantidad ?? 0;

    const totalQuantityOf = (productId: number) =>
        items.filter((i) => i.product.id === productId).reduce((sum, i) => sum + i.cantidad, 0);

    const total = items.reduce((sum, i) => sum + getCartItemUnitPrice(i) * i.cantidad, 0);

    const count = items.reduce((sum, i) => {
        return isWeightUnit(i.product.unidad_medida) ? sum + 1 : sum + i.cantidad;
    }, 0);

    return {
        items,
        add,
        addWithWeight,
        remove,
        deleteItem,
        setWeight,
        clear,
        quantityOf,
        totalQuantityOf,
        total,
        count,
        setNote,
    };
};
