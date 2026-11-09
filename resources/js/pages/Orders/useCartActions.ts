import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { isItemAlreadyRemovedError } from "@/utils/axiosError";
import { reportActionError } from "@/utils/reportActionError";
import { useOptimisticPendingSet } from "@/hooks/useOptimisticPendingSet";
import { useCartLineSync } from "@/hooks/useCartLineSync";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { ICartItem } from "@/models/ICartItem";
import { IAddonSelection } from "@/models/IAddon";
import { IOrderProduct } from "@/models/IOrderProduct";
import { TAddToCart } from "@/models/ICartDraft";
import { toAddonSelections } from "@/utils/cartAddons";
import { applyCartDraft, buildCartLineTemplate, findMergeableCartItem } from "@/utils/cartDraft";
import {
    useCreateOrderProduct,
    useUpdateProductInOrder,
    useUpdateOrderProductNote,
    useDeleteItemFromOrder,
    useClearCartFromOrder,
} from "@/services/useOrderService";
import { useInvalidateOrder } from "./useInvalidateOrder";

// Fixed guard key for addExtra: the extra has no id until the server creates
// it, so there's nothing to key the pending-set on yet. 0 can't collide with a real
// order_product.id (positive) nor with the temporary ids of unsynced lines (negative).
const EXTRA_PENDING_KEY = 0;

export const useCartActions = (
    orderId: number,
    serverCart: ICartItem[],
    isReadOnly: boolean,
) => {
    const queryClient = useQueryClient();
    const invalidateOrder = useInvalidateOrder(orderId);
    const { isPending, withPending } = useOptimisticPendingSet<number>();

    const { mutateAsync: createOrderProduct } = useCreateOrderProduct();
    const { mutateAsync: updateProduct } = useUpdateProductInOrder(orderId);
    const { mutateAsync: updateNote } = useUpdateOrderProductNote(orderId);
    const { mutateAsync: deleteItem } =
        useDeleteItemFromOrder(orderId);
    const { mutateAsync: clearOrderCart, isPending: isClearingCart } =
        useClearCartFromOrder(orderId);

    // Taps on the cart only touch local state (draftLines); the sync hook batches them per line
    // and sends one request per line after a short pause. Server errors revert that line only.
    const { draftLines, addLine, adjustQuantity, flushLine, flushAll } = useCartLineSync({
        onCreate: async (template, quantity) => {
            const response = await createOrderProduct({
                orderId,
                data: {
                    producto_id: template.id,
                    variant_id: template.variantId,
                    cantidad: quantity,
                    descuento: 0,
                    ...(template.addons.length > 0 ? { addons: toAddonSelections(template.addons) } : {}),
                },
            });
            return (response as { data: { data: IOrderProduct } }).data.data.id!;
        },
        onUpdate: (orderProductId, quantity) =>
            updateProduct({ orderProductId, data: { cantidad: quantity } }),
        onDelete: (orderProductId) => deleteItem(orderProductId),
        onError: (error) => {
            // The line was already removed on the server: the refetch below reconciles silently.
            if (!isItemAlreadyRemovedError(error)) {
                reportActionError(error, "useCartActions.syncLine", "Error al actualizar el pedido");
            }
            void invalidateOrder();
        },
        // throwOnError: si el refetch falla, el motor conserva las líneas locales en vez de mostrar datos viejos.
        onSettled: () =>
            queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Orders}/${orderId}`] }, { throwOnError: true }),
    });

    // What the user sees: the server cart with the pending local changes on top.
    const cart = applyCartDraft(serverCart, draftLines);

    // Add regular product (click on ProductCard).
    // If the product already exists in the cart, increment its quantity instead
    // of creating a duplicate entry.
    const addToCart: TAddToCart = (product, variant, addons = []) => {
        if (isReadOnly) return;

        const template = buildCartLineTemplate(product, variant, addons);
        const existingItem = findMergeableCartItem(cart, template);

        if (existingItem) {
            adjustQuantity(existingItem, 1);
        } else {
            addLine(template, 1);
        }
    };

    // Add custom extra (no producto_id)
    const addExtra = async (
        nombre: string,
        precio: number,
        cantidad: number,
    ) => {
        if (isReadOnly || isPending(EXTRA_PENDING_KEY)) return;
        try {
            await withPending([EXTRA_PENDING_KEY], () =>
                createOrderProduct(
                    { orderId, data: { nombre_extra: nombre, cantidad, precio, descuento: 0 } },
                    { onSuccess: invalidateOrder },
                ),
            );
        } catch (error) {
            reportActionError(error, "useCartActions.addExtra", "Error al agregar extra");
        }
    };

    // Update quantity — only valid for regular products
    const updateQuantity = (orderProductId: number, delta: number) => {
        if (isReadOnly) return;
        const existing = cart.find((item) => item.orderProductId === orderProductId);
        if (existing) adjustQuantity(existing, delta);
    };

    // Save observation on any item (product or extra) by orderProductId
    const saveObservacion = async (
        orderProductId: number,
        observacion: string,
    ) => {
        if (isReadOnly) return;
        try {
            // A line still being created has a temporary id: wait for the real one.
            const realOrderProductId = await flushLine(orderProductId);
            if (realOrderProductId === null) return;
            await updateNote(
                { orderProductId: realOrderProductId, observacion },
                { onSuccess: invalidateOrder },
            );
        } catch (error) {
            reportActionError(error, "useCartActions.saveObservacion", "Error al guardar la observación");
        }
    };

    // Replace the toppings of a line (empty array removes them all). The backend recalculates
    // the line subtotal and the order total; quantity and discount are left untouched.
    const updateLineAddons = async (orderProductId: number, addons: IAddonSelection[]) => {
        if (isReadOnly || isPending(orderProductId)) return;
        try {
            await withPending([orderProductId], async () => {
                const realOrderProductId = await flushLine(orderProductId);
                if (realOrderProductId === null) return;
                await updateProduct(
                    { orderProductId: realOrderProductId, data: { addons } },
                    { onSuccess: invalidateOrder },
                );
            });
        } catch (error) {
            reportActionError(error, "useCartActions.updateLineAddons", "Error al actualizar los toppings");
        }
    };

    // Remove any item (product or extra) by orderProductId.
    const removeFromCart = (orderProductId: number) => {
        if (isReadOnly) return;
        const existing = cart.find((item) => item.orderProductId === orderProductId);
        if (existing) adjustQuantity(existing, -existing.quantity);
    };

    const clearCart = async () => {
        if (isReadOnly || isClearingCart) return;
        const result = await Swal.fire({
            title: "¿Limpiar pedido?",
            text: "Se eliminarán todos los productos de la orden.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#78716c",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, limpiar",
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;
        try {
            // Lines still being created would otherwise land after the cart was emptied.
            await flushAll();
            await clearOrderCart(undefined, { onSuccess: invalidateOrder });
        } catch (error) {
            reportActionError(error, "useCartActions.clearCart", "Error al limpiar pedido");
        }
    };

    return {
        cart,
        hasPending: draftLines.length > 0,
        addToCart,
        addExtra,
        updateQuantity,
        saveObservacion,
        updateLineAddons,
        removeFromCart,
        clearCart,
        isClearingCart,
        flushLine,
        flushAll,
    };
};
