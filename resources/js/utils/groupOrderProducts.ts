import { IOrderProduct } from "@/models/IOrderProduct";
import { IProductGroup } from "@/models/IProductGroup";

// Groups order_products by display name (nombre_extra or product name) so the
// kitchen view can mark an entire repeated item (e.g. "2x Tacos") ready at once.
export const groupOrderProducts = (orderProducts: IOrderProduct[] = []): IProductGroup[] => {
    const map = new Map<string, IOrderProduct[]>();
    for (const item of orderProducts) {
        const key = item.nombre_extra ?? item.product?.nombre ?? `id-${item.id}`;
        const existing = map.get(key) ?? [];
        map.set(key, [...existing, item]);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
        key,
        name: key,
        items,
        readyCount: items.filter((i) => i.is_ready).length,
        totalCount: items.length,
        allReady: items.every((i) => i.is_ready),
    }));
};
