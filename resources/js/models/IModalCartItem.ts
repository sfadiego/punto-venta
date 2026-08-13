import { IProduct } from "./IProduct";

export interface IModalCartItem {
    orderProductId: number;
    productId: number;
    product: IProduct;
    cantidad: number;
    // precio real guardado en order_product (puede diferir del catálogo en modo precio)
    precioEfectivo: number;
    // variante seleccionada (ej. "Pieza" de un producto que también se vende por paquete) —
    // null/undefined para la línea del precio base del producto.
    variantId?: number | null;
    variantName?: string | null;
}
