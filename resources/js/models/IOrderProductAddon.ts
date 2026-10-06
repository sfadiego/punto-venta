/** Topping elegido en una línea de orden — nombre y precio son la copia del momento de la venta. */
export interface IOrderProductAddon {
    id: number;
    order_product_id: number;
    /** null si el topping se eliminó del catálogo después de la venta. */
    addon_id: number | null;
    name: string;
    price: number;
    quantity: number;
}
