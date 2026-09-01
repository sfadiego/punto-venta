import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";

// Existencia disponible para vender. Productos sin manage_stock no tienen límite (Infinity)
// — el backend tampoco los valida contra stock, así que el frontend no debe inventar un tope.
// Tipo estructural (no IProduct completo) para poder reutilizarse con IMenuProduct (menú público).
export const getAvailableStock = (product: Pick<IProduct, "manage_stock" | "stock">): number =>
    product.manage_stock && product.stock !== null ? parseFloat(product.stock) : Infinity;

// Igual que getAvailableStock, pero resuelve por variante cuando se pasa variantId: si el
// producto tiene esa variante y lleva stock (no null), usa el stock de la variante en vez del
// producto — cada talla/variante lleva su propia existencia cuando el producto maneja stock.
export const getAvailableStockFor = (
    product: Pick<IProduct, "manage_stock" | "stock" | "variants">,
    variantId?: number | null,
): number => {
    if (!product.manage_stock) return Infinity;

    if (variantId) {
        const variant = product.variants?.find((v) => v.id === variantId);
        return variant?.stock !== null && variant?.stock !== undefined ? parseFloat(variant.stock) : Infinity;
    }

    return product.stock !== null ? parseFloat(product.stock) : Infinity;
};

// Espejo de ProductModel::hasLowStock() en el backend — misma condición, para no esperar
// al roundtrip y resaltar la fila en el listado apenas llegan los datos. Sin min_stock
// configurado se asume 0 (no "sin límite") — así un producto en 0 existencias siempre se
// marca como bajo stock, tenga o no un mínimo definido.
export const isLowStock = (product: IProduct): boolean => {
    if (!product.manage_stock || product.stock === null) return false;
    return parseFloat(product.stock) <= (product.min_stock !== null ? parseFloat(product.min_stock) : 0);
};

// Espejo de ProductVariantModel::hasLowStock() — misma condición a nivel variante.
export const isVariantLowStock = (variant: Pick<IProductVariant, "stock" | "min_stock">): boolean => {
    if (variant.stock === null) return false;
    return parseFloat(variant.stock) <= (variant.min_stock !== null ? parseFloat(variant.min_stock) : 0);
};

// Suma el stock de las variantes activas de un producto (para la columna agregada del
// listado). Devuelve null si el producto no maneja stock o no tiene variantes activas.
export const getAggregateVariantStock = (product: Pick<IProduct, "manage_stock" | "variants">): number | null => {
    if (!product.manage_stock) return null;

    const activeVariants = (product.variants ?? []).filter((v) => v.activo);
    if (activeVariants.length === 0) return null;

    return activeVariants.reduce((sum, v) => sum + (v.stock !== null ? parseFloat(v.stock) : 0), 0);
};

// true si el producto tiene al menos una variante activa — usado para decidir si la fila del
// listado es expandible (ver variantes rápido), sin importar si el producto maneja stock o no.
export const hasActiveVariants = (product: Pick<IProduct, "variants">): boolean =>
    (product.variants ?? []).some((v) => v.activo);

// true si el producto (sin variantes) está en/bajo su mínimo, o si alguna de sus variantes
// activas lo está — usado para resaltar filas del listado sin importar dónde vive el stock.
export const isProductRowLowStock = (product: IProduct): boolean => {
    const activeVariants = (product.variants ?? []).filter((v) => v.activo);

    if (activeVariants.length > 0) {
        return product.manage_stock && activeVariants.some((v) => isVariantLowStock(v));
    }

    return isLowStock(product);
};
