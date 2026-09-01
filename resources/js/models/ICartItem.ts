export interface ICartItem {
    orderProductId: number; // order_product.id — key for remove/update
    id: number | null; // producto_id (null for extras)
    name: string;
    price: number;
    quantity: number;
    descuento: number;
    isExtra: boolean;
    observacion: string | null;
    isReady: boolean;
    variantId: number | null;
    variantName: string | null;
    // Para topar el stepper "+" contra el stock disponible (ver CartItemRow). Si la línea
    // tiene variante, el tope usa variantStock (existencia propia de esa variante) en vez de
    // stock (del producto base).
    manageStock: boolean;
    stock: string | null;
    variantStock: string | null;
}
