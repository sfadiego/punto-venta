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
            variantId: op.variant_id ?? null,
            variantName: op.variant?.nombre ?? null,
        }));

// Líneas del carrito en el formato de los endpoints de alta de la orden (lote y venta directa).
export const buildOrderItems = (cart: IModalCartItem[]) =>
    cart.map((item) => ({
        producto_id: item.productId,
        variant_id: item.variantId ?? null,
        cantidad: item.cantidad,
    }));

// El carrito local difiere de lo guardado en la orden: otra cantidad, una línea nueva o una quitada.
export const hasCartChanges = (cart: IModalCartItem[], saved: IModalCartItem[]): boolean =>
    cart.length !== saved.length ||
    cart.some((item) => saved.find((line) => line.orderProductId === item.orderProductId)?.cantidad !== item.cantidad);

export const calcModalCartTotal = (cart: IModalCartItem[]): number =>
    cart.reduce((sum, item) => sum + item.precioEfectivo * item.cantidad, 0);
