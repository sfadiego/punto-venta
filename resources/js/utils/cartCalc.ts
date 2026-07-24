import { IOrderProduct } from "@/models/IOrderProduct";
import { ICartItem } from "@/models/ICartItem";

export const buildCartItems = (orderProducts: IOrderProduct[] = []): ICartItem[] =>
    orderProducts.map((op) => ({
        orderProductId: op.id!,
        id: op.producto_id ?? null,
        name: op.nombre_extra ?? op.product?.nombre ?? "",
        price: op.precio,
        quantity: parseFloat(String(op.cantidad)),
        descuento: op.descuento ?? 0,
        isExtra: !op.producto_id,
        observacion: op.observacion ?? null,
        isReady: op.is_ready ?? false,
    }));

export const getCartQuantityForProduct = (cart: ICartItem[], productId: number): number =>
    cart
        .filter((item) => item.id === productId)
        .reduce((sum, item) => sum + item.quantity, 0);

export const calcCartTotals = (cart: ICartItem[], orderDiscount: number) => {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity * (1 - item.descuento / 100),
        0,
    );
    const total = subtotal * (1 - orderDiscount / 100);

    return { cartCount, subtotal, total };
};
