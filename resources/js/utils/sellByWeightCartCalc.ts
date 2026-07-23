import { IOrderProduct } from "@/models/IOrderProduct";
import { IModalCartItem } from "@/models/IModalCartItem";

export const buildModalCartItems = (orderProducts: IOrderProduct[] = []): IModalCartItem[] =>
    orderProducts
        .filter((op) => op.product != null && op.producto_id != null)
        .map((op) => ({
            orderProductId: op.id!,
            productId: op.producto_id!,
            product: op.product,
            cantidad: parseFloat(String(op.cantidad)),
            precioEfectivo: parseFloat(String(op.precio)),
        }));

export const calcModalCartTotal = (cart: IModalCartItem[]): number =>
    cart.reduce((sum, item) => sum + item.precioEfectivo * item.cantidad, 0);
