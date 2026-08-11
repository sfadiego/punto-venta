import { IProduct } from "@/models/IProduct";

// Existencia disponible para vender. Productos sin manage_stock no tienen límite (Infinity)
// — el backend tampoco los valida contra stock, así que el frontend no debe inventar un tope.
// Tipo estructural (no IProduct completo) para poder reutilizarse con IMenuProduct (menú público).
export const getAvailableStock = (product: Pick<IProduct, "manage_stock" | "stock">): number =>
    product.manage_stock && product.stock !== null ? parseFloat(product.stock) : Infinity;

// Espejo de ProductModel::hasLowStock() en el backend — misma condición, para no esperar
// al roundtrip y resaltar la fila en el listado apenas llegan los datos.
export const isLowStock = (product: IProduct): boolean => {
    if (!product.manage_stock || product.min_stock === null || product.stock === null) return false;
    return parseFloat(product.stock) <= parseFloat(product.min_stock);
};
