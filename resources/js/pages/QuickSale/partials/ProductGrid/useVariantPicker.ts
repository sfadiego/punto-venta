import { useState } from "react";
import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";

// Productos "und" que también venden por pieza/paquete (variantes) eligen cuál agregar desde
// un modal — mismo patrón que Orders/Menu (VariantPickerModal) — en vez de un toggle inline,
// que no escala con muchas variantes.
export const useVariantPicker = (
    product: IProduct,
    onAdd: (product: IProduct, cantidad: number, variant?: IProductVariant | null) => void,
) => {
    const [isVariantPickerOpen, setIsVariantPickerOpen] = useState(false);
    const activeVariants = (product.variants ?? []).filter((v) => v.activo);

    const handleSelectVariant = (variant: IProductVariant | null) => {
        setIsVariantPickerOpen(false);
        onAdd(product, 1, variant);
    };

    return {
        isVariantPickerOpen,
        setIsVariantPickerOpen,
        activeVariants,
        handleSelectVariant,
    };
};
