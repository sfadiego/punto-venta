import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { isItemAlreadyRemovedError, getUserFacingErrorMessage } from "@/utils/axiosError";
import { useOptimisticPendingSet } from "@/hooks/useOptimisticPendingSet";
import { ICartItem } from "@/models/ICartItem";
import {
    useAddProductToOrder,
    useUpdateProductInOrder,
    useUpdateOrderProductNote,
    useDeleteItemFromOrder,
    useClearCartFromOrder,
} from "@/services/useOrderService";
import { useInvalidateOrder } from "./useInvalidateOrder";

// Fixed guard key for addExtra: the extra has no id until the server creates
// it, so there's nothing to key the pending-set on yet.
const EXTRA_PENDING_KEY = -1;

export const useCartActions = (
    orderId: number,
    cart: ICartItem[],
    isReadOnly: boolean,
) => {
    const invalidateOrder = useInvalidateOrder(orderId);
    const { pendingIds: pendingProductIds, isPending, withPending } =
        useOptimisticPendingSet<number>();

    const { mutateAsync: addProduct } = useAddProductToOrder(orderId);
    const { mutateAsync: updateProduct } = useUpdateProductInOrder(orderId);
    const { mutateAsync: updateNote } = useUpdateOrderProductNote(orderId);
    const { mutateAsync: deleteItem, isPending: isDeletingItem } =
        useDeleteItemFromOrder(orderId);
    const { mutateAsync: clearOrderCart, isPending: isClearingCart } =
        useClearCartFromOrder(orderId);

    // Add regular product (click on ProductCard).
    // If the product already exists in the cart, increment its quantity instead
    // of creating a duplicate entry.
    const addToCart = async (
        productId: number,
        _name: string,
        price: number,
    ) => {
        if (isReadOnly || isPending(productId)) return;

        // Merge only if the existing entry is still pending (not ready).
        // A ready item means it was already prepared by the kitchen — new clicks
        // must create a separate entry so staff can distinguish new from served.
        const existingItem = cart.find(
            (item) => item.id === productId && !item.isReady,
        );

        if (existingItem && isPending(existingItem.orderProductId)) return;

        const guardIds = existingItem
            ? [productId, existingItem.orderProductId]
            : [productId];

        try {
            await withPending(guardIds, () =>
                existingItem
                    ? updateProduct(
                          {
                              orderProductId: existingItem.orderProductId,
                              data: { cantidad: existingItem.quantity + 1 },
                          },
                          { onSuccess: invalidateOrder },
                      )
                    : addProduct(
                          {
                              producto_id: productId,
                              cantidad: 1,
                              precio: price,
                              descuento: 0,
                          },
                          { onSuccess: invalidateOrder },
                      ),
            );
        } catch (error) {
            logUnexpectedError(error, "useCartActions.addToCart");
            toast.error(getUserFacingErrorMessage(error, "Error al agregar producto"));
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
                addProduct(
                    { nombre_extra: nombre, cantidad, precio, descuento: 0 },
                    { onSuccess: invalidateOrder },
                ),
            );
        } catch (error) {
            logUnexpectedError(error, "useCartActions.addExtra");
            toast.error(getUserFacingErrorMessage(error, "Error al agregar extra"));
        }
    };

    // Update quantity — only valid for regular products
    const updateQuantity = async (orderProductId: number, delta: number) => {
        if (isReadOnly || isPending(orderProductId)) return;
        const existing = cart.find(
            (item) => item.orderProductId === orderProductId,
        );
        if (!existing) return;
        const newQty = existing.quantity + delta;

        try {
            await withPending([orderProductId], async () => {
                if (newQty <= 0) {
                    if (isDeletingItem) return;
                    await deleteItem(existing.orderProductId, {
                        onSuccess: invalidateOrder,
                    });
                } else {
                    await updateProduct(
                        { orderProductId, data: { cantidad: newQty } },
                        { onSuccess: invalidateOrder },
                    );
                }
            });
        } catch (error) {
            if (isItemAlreadyRemovedError(error)) {
                invalidateOrder();
                return;
            }
            logUnexpectedError(error, "useCartActions.updateQuantity");
            toast.error(getUserFacingErrorMessage(error, "Error al actualizar producto"));
        }
    };

    // Save observation on any item (product or extra) by orderProductId
    const saveObservacion = async (
        orderProductId: number,
        observacion: string,
    ) => {
        if (isReadOnly) return;
        try {
            await updateNote(
                { orderProductId, observacion },
                { onSuccess: invalidateOrder },
            );
        } catch (error) {
            logUnexpectedError(error, "useCartActions.saveObservacion");
            toast.error(getUserFacingErrorMessage(error, "Error al guardar la observación"));
        }
    };

    // Remove any item (product or extra) by orderProductId.
    // Guards on the mutation's own `isPending` too — instead of relying only on
    // the local pending-set — so a second remove/quantity-drop-to-zero can't
    // fire a duplicate DELETE while the previous one hasn't settled yet.
    const removeFromCart = async (orderProductId: number) => {
        if (isReadOnly || isPending(orderProductId) || isDeletingItem) return;
        try {
            await withPending([orderProductId], () =>
                deleteItem(orderProductId, { onSuccess: invalidateOrder }),
            );
        } catch (error) {
            // "elemento no encontrado" means it was already removed by another
            // in-flight request — the end state the user wanted is already true.
            if (isItemAlreadyRemovedError(error)) {
                invalidateOrder();
                return;
            }
            logUnexpectedError(error, "useCartActions.removeFromCart");
            toast.error(getUserFacingErrorMessage(error, "Error al eliminar producto"));
        }
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
            await clearOrderCart(undefined, { onSuccess: invalidateOrder });
        } catch (error) {
            logUnexpectedError(error, "useCartActions.clearCart");
            toast.error(getUserFacingErrorMessage(error, "Error al limpiar pedido"));
        }
    };

    return {
        pendingProductIds,
        addToCart,
        addExtra,
        updateQuantity,
        saveObservacion,
        removeFromCart,
        clearCart,
        isClearingCart,
    };
};
