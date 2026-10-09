import { IOrderProduct } from "@/models/IOrderProduct";

/** Nombre mostrable de una línea: el producto, con su variante si la tiene, o el nombre del extra. */
export const getOrderProductName = (item: IOrderProduct): string => {
    const base = item.product?.nombre ?? item.nombre_extra ?? "Producto";
    return item.variant?.nombre ? `${base} · ${item.variant.nombre}` : base;
};

/** Resumen de una línea de texto: el primer producto y cuántos más lleva, ej. "Camión rojo +2 más". */
export const summarizeOrderProducts = (items: IOrderProduct[] = []): string => {
    if (items.length === 0) return "";
    const [first, ...rest] = items;
    return rest.length > 0 ? `${getOrderProductName(first)} +${rest.length} más` : getOrderProductName(first);
};
