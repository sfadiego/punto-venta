import { useState } from "react";
import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";
import { VariantOption } from "@/components/orders/VariantPickerModal/VariantPickerModal";
import { getAvailableStockFor } from "@/utils/stock";

// Productos "und" que también venden por pieza/paquete (variantes) eligen cuál agregar desde
// un modal — mismo patrón que Orders/Menu (VariantPickerModal) — en vez de un toggle inline,
// que no escala con muchas variantes.
export const useVariantPicker = (
    product: IProduct,
    quantityOf: (product: IProduct, variant?: IProductVariant | null) => number,
    onAdd: (product: IProduct, cantidad: number, variant?: IProductVariant | null) => void,
) => {
    const [isVariantPickerOpen, setIsVariantPickerOpen] = useState(false);
    const activeVariants = (product.variants ?? []).filter((v) => v.activo);

    const handleSelectVariant = (variant: IProductVariant) => {
        setIsVariantPickerOpen(false);
        onAdd(product, 1, variant);
    };

    const variantOptions: VariantOption[] = activeVariants.map((variant) => {
        const available = getAvailableStockFor(product, variant.id);
        const inCart = quantityOf(product, variant);
        const remaining = available === Infinity ? Infinity : available - inCart;
        return { variant, remaining, exhausted: remaining <= 0 };
    });

    return {
        isVariantPickerOpen,
        setIsVariantPickerOpen,
        activeVariants,
        handleSelectVariant,
        variantOptions,
    };
};
