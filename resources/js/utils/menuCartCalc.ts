import { ICartItem } from "@/models/IMenu";

export const getCartItemUnitPrice = (item: ICartItem): number => Number(item.variant?.precio ?? item.product.precio);
