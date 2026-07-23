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
}
