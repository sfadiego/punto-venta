import { ICartAddon, ICartItem } from "@/models/ICartItem";
import { IOrderProduct } from "@/models/IOrderProduct";
import { IOrderProductAddon } from "@/models/IOrderProductAddon";

// Suma de los toppings por UNA unidad de la línea.
export const getAddonsUnitTotal = (addons: Pick<ICartAddon, "price" | "quantity">[]): number =>
    addons.reduce((sum, addon) => sum + addon.price * addon.quantity, 0);

// Precio de una unidad ya con sus toppings: lo que se multiplica por cantidad y descuento.
export const getCartItemUnitPrice = (item: Pick<ICartItem, "price" | "addons">): number =>
    item.price + getAddonsUnitTotal(item.addons);

// Firma estable de un conjunto de toppings ("3:1|7:2"), sin importar el orden. Dos líneas del
// mismo producto y variante solo se fusionan si llevan exactamente los mismos toppings.
export const getAddonsSignature = (entries: { id: number | null; quantity: number }[]): string =>
    entries
        .map((entry) => `${entry.id ?? "x"}:${entry.quantity}`)
        .sort()
        .join("|");

// Suma de los toppings por UNA unidad de una línea tal como llega de la API (detalle de orden).
export const getOrderProductAddonsUnitTotal = (orderProduct: Pick<IOrderProduct, "addons">): number =>
    (orderProduct.addons ?? []).reduce((sum, addon) => sum + addon.price * addon.quantity, 0);

// Firma de los toppings de una línea para agrupar en cocina. Usa el nombre (lo que lee quien
// prepara) y no el id: un topping borrado del catálogo conserva su nombre copiado en la venta.
export const getOrderProductAddonsSignature = (addons: IOrderProductAddon[] = []): string =>
    addons
        .map((addon) => `${addon.name}:${addon.quantity}`)
        .sort()
        .join("|");
