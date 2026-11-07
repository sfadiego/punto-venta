import { IAddonSelection } from "@/models/IAddon";
import { ICartItem } from "@/models/ICartItem";
import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";

/** Datos para pintar una línea que el servidor todavía no tiene (nombre, precio, toppings...). */
export type ICartLineTemplate = Omit<ICartItem, "orderProductId" | "quantity">;

/** Cambio local pendiente de enviar al servidor sobre una línea del carrito. */
export interface ICartDraftLine {
    /** Id negativo estable mientras la línea no existe en el servidor; nunca choca con un order_product.id real. */
    tempId: number;
    /** order_product.id real. Null hasta que el POST de creación responde. */
    orderProductId: number | null;
    /** Cantidad deseada (absoluta). 0 significa borrar la línea. */
    quantity: number;
    /** Solo para líneas nuevas: con qué pintarlas mientras el servidor no las devuelve. */
    template: ICartLineTemplate | null;
}

/** Click en un producto del selector: suma una unidad (con la variante y toppings elegidos, si los hay). */
export type TAddToCart = (
    product: IProduct,
    variant: IProductVariant | null,
    addons?: IAddonSelection[],
) => void;
