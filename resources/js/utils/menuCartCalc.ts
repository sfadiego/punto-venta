import { ICartItem } from "@/models/IMenu";

export const getCartItemUnitPrice = (item: ICartItem): number => Number(item.variant?.precio ?? item.product.precio);

export const roundCartQuantity = (n: number): number => parseFloat(n.toFixed(3));

export const matchesCartLine = (item: ICartItem, productId: number, variantId?: number | null): boolean =>
    item.product.id === productId && (item.variant?.id ?? null) === (variantId ?? null);
