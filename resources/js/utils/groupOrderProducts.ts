import { IOrderProduct } from "@/models/IOrderProduct";
import { IProductGroup } from "@/models/IProductGroup";
import { getOrderProductAddonsSignature } from "@/utils/cartAddons";

// Groups order_products by display name (nombre_extra or product name) and variant so the
// kitchen view can mark an entire repeated item (e.g. "2x Tacos") ready at once, without
// mixing different variants of the same product (e.g. "Pizza Chica" vs "Pizza Grande"). Lines of
// the same product with different toppings are never merged either: the kitchen prepares
// "Waffle + Nieve" and "Waffle + Chocolate" differently.
export const groupOrderProducts = (orderProducts: IOrderProduct[] = []): IProductGroup[] => {
    const map = new Map<string, IOrderProduct[]>();
    for (const item of orderProducts) {
        const baseName = item.nombre_extra ?? item.product?.nombre ?? `id-${item.id}`;
        const variantKey = item.variant ? `${baseName}::${item.variant.id}` : baseName;
        const addonsSignature = getOrderProductAddonsSignature(item.addons);
        const key = addonsSignature ? `${variantKey}::addons:${addonsSignature}` : variantKey;
        const existing = map.get(key) ?? [];
        map.set(key, [...existing, item]);
    }
    return Array.from(map.entries()).map(([key, items]) => {
        const baseName = items[0].nombre_extra ?? items[0].product?.nombre ?? `id-${items[0].id}`;
        const variantName = items[0].variant?.nombre;
        return {
            key,
            name: variantName ? `${baseName} (${variantName})` : baseName,
            items,
            readyCount: items.filter((i) => i.is_ready).length,
            totalCount: items.length,
            totalUnits: items.reduce((sum, i) => sum + parseFloat(i.cantidad.toString()), 0),
            allReady: items.every((i) => i.is_ready),
            addons: items[0].addons ?? [],
        };
    });
};
