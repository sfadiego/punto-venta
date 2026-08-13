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
    // Del producto base — para topar el stepper "+" contra el stock disponible (ver
    // CartItemRow). Una línea de variante (variantId != null) no descuenta stock, así que no
    // se limita por esto.
    manageStock: boolean;
    stock: string | null;
}
