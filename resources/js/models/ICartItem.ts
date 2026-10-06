import { IAddon } from "@/models/IAddon";

export interface ICartAddon {
    addonId: number | null;
    name: string;
    price: number;
    quantity: number;
}

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
    /** Toppings de la línea (vacío si no lleva). Su precio se suma al unitario antes de multiplicar por cantidad. */
    addons: ICartAddon[];
    /** Toppings activos que ofrece el producto: lo que se puede elegir al editar los de la línea. */
    availableAddons: IAddon[];
    // Para topar el stepper "+" contra el stock disponible (ver CartItemRow). Si la línea
    // tiene variante, el tope usa variantStock (existencia propia de esa variante) en vez de
    // stock (del producto base).
    manageStock: boolean;
    stock: string | null;
    variantStock: string | null;
}
