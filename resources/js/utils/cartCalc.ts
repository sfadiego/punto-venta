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
        variantId: op.variant_id ?? null,
        variantName: op.variant?.nombre ?? null,
        manageStock: op.product?.manage_stock ?? false,
        stock: op.product?.stock ?? null,
        variantStock: op.variant?.stock ?? null,
    }));

// Total en carrito agregando TODAS las variantes del producto — solo correcto de usar cuando
// el producto no tiene variantes, o cuando se quiere deliberadamente el agregado.
export const getCartQuantityForProduct = (cart: ICartItem[], productId: number): number =>
    cart
        .filter((item) => item.id === productId)
        .reduce((sum, item) => sum + item.quantity, 0);

// Igual que getCartQuantityForProduct pero también filtra por variante — cada variante lleva
// su propio stock, así que el tope de "cuánto más se puede agregar" debe calcularse por línea
// (variantId null agrupa las líneas sin variante, no las de cualquier variante).
export const getCartQuantityFor = (cart: ICartItem[], productId: number, variantId?: number | null): number =>
    cart
        .filter((item) => item.id === productId && (item.variantId ?? null) === (variantId ?? null))
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
