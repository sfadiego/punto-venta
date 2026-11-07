import { IAddonSelection } from "@/models/IAddon";
import { ICartItem } from "@/models/ICartItem";
import { ICartDraftLine, ICartLineTemplate } from "@/models/ICartDraft";
import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";
import { getAddonsSignature } from "@/utils/cartAddons";

// Línea tal como se pinta en el carrito antes de que el servidor la devuelva. Los nombres y
// precios de los toppings salen del catálogo del producto, no de la respuesta de la API.
export const buildCartLineTemplate = (
    product: IProduct,
    variant: IProductVariant | null,
    selection: IAddonSelection[],
): ICartLineTemplate => ({
    id: product.id,
    name: product.nombre,
    price: variant?.precio ?? product.precio,
    descuento: 0,
    isExtra: false,
    observacion: null,
    isReady: false,
    variantId: variant?.id ?? null,
    variantName: variant?.nombre ?? null,
    addons: selection.flatMap((entry) => {
        const addon = (product.addons ?? []).find((candidate) => candidate.id === entry.addon_id);
        return addon ? [{ addonId: addon.id, name: addon.name, price: addon.price, quantity: entry.quantity }] : [];
    }),
    availableAddons: (product.addons ?? []).filter((addon) => addon.is_active),
    manageStock: product.manage_stock,
    stock: product.stock,
    variantStock: variant?.stock ?? null,
});

// Línea del carrito a la que se le suma una unidad en vez de crear otra: mismo producto, misma
// variante y exactamente los mismos toppings, y que la cocina no la haya marcado lista.
export const findMergeableCartItem = (cart: ICartItem[], template: ICartLineTemplate): ICartItem | undefined => {
    const signature = getAddonsSignature(template.addons.map((addon) => ({ id: addon.addonId, quantity: addon.quantity })));
    return cart.find(
        (item) =>
            item.id === template.id &&
            item.variantId === template.variantId &&
            !item.isReady &&
            getAddonsSignature(item.addons.map((addon) => ({ id: addon.addonId, quantity: addon.quantity }))) === signature,
    );
};

// Carrito que ve el usuario: el del servidor con los cambios locales pendientes encima.
// - Línea del servidor con cambio local: se pinta con la cantidad deseada (0 la oculta).
// - Línea sin contraparte en el servidor (aún no se crea, o ya se creó pero el refetch no
//   la trae todavía): se pinta desde su template, con el id real si ya lo tiene o el temporal.
export const applyCartDraft = (serverCart: ICartItem[], draftLines: ICartDraftLine[]): ICartItem[] => {
    if (draftLines.length === 0) return serverCart;

    const draftByOrderProductId = new Map<number, ICartDraftLine>();
    draftLines.forEach((line) => {
        if (line.orderProductId !== null) draftByOrderProductId.set(line.orderProductId, line);
    });
    const serverIds = new Set(serverCart.map((item) => item.orderProductId));

    const merged = serverCart.flatMap((item) => {
        const draft = draftByOrderProductId.get(item.orderProductId);
        if (!draft) return [item];
        return draft.quantity > 0 ? [{ ...item, quantity: draft.quantity }] : [];
    });

    const created = draftLines
        .filter(
            (line) =>
                line.template !== null &&
                line.quantity > 0 &&
                (line.orderProductId === null || !serverIds.has(line.orderProductId)),
        )
        .map((line) => ({
            ...line.template!,
            orderProductId: line.orderProductId ?? line.tempId,
            quantity: line.quantity,
        }));

    return [...merged, ...created];
};
