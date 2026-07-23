import { logUnexpectedError } from "@/plugins/logger.plugin";
import { isItemAlreadyRemovedError } from "@/utils/axiosError";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { useOptimisticPendingSet } from "@/hooks/useOptimisticPendingSet";
import { buildCartItems, calcCartTotals } from "@/utils/cartCalc";
import { ICartItem } from "@/models/ICartItem";
import {
    useShowOrder,
    useAddProductToOrder,
    useUpdateProductInOrder,
    useUpdateOrderProductNote,
    useDeleteItemFromOrder,
    useUpdateOrder,
} from "@/services/useOrderService";

// Fixed guard key for addExtra: the extra has no id until the server creates
// it, so there's nothing to key the pending-set on yet.
const EXTRA_PENDING_KEY = -1;

export const useTakeOrder = () => {
    const { id } = useParams<{ id: string }>();
    const orderId = Number(id);
    const queryClient = useQueryClient();
    const { pendingIds: pendingProductIds, isPending, withPending } =
        useOptimisticPendingSet<number>();

    const orderQueryKey = `${ApiRoutes.Orders}/${orderId}`;
    const invalidateOrder = () =>
        queryClient.invalidateQueries({ queryKey: [orderQueryKey] });

    const { data: order, isLoading: loadingOrder } = useShowOrder(orderId);

    const editableStatuses = [
        OrderStatusEnum.InProcess,
        OrderStatusEnum.Served,
    ];
    const isReadOnly =
        !order || !editableStatuses.includes(order.estatus_pedido_id);

    const cart: ICartItem[] = buildCartItems(order?.order_products);

    const { mutateAsync: addProduct } = useAddProductToOrder(orderId);
    const { mutateAsync: updateProduct } = useUpdateProductInOrder(orderId);
    const { mutateAsync: updateNote } = useUpdateOrderProductNote(orderId);
    const { mutateAsync: deleteItem, isPending: isDeletingItem } =
        useDeleteItemFromOrder(orderId);
    const { mutateAsync: updateOrder } = useUpdateOrder(orderId);

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
            logUnexpectedError(error, "useTakeOrder.addToCart");
            toast.error("Error al agregar producto");
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
            logUnexpectedError(error, "useTakeOrder.addExtra");
            toast.error("Error al agregar extra");
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
            logUnexpectedError(error, "useTakeOrder.updateQuantity");
            toast.error("Error al actualizar producto");
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
            logUnexpectedError(error, "useTakeOrder.saveObservacion");
            toast.error("Error al guardar la observación");
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
            logUnexpectedError(error, "useTakeOrder.removeFromCart");
            toast.error("Error al eliminar producto");
        }
    };

    const clearCart = async () => {
        if (isReadOnly) return;
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
        cart.forEach((item) => {
            deleteItem(item.orderProductId, {
                onSuccess: invalidateOrder,
            }).catch(() => toast.error("Error al limpiar pedido"));
        });
    };

    const updateOrderDiscount = async (descuento: number) => {
        if (isReadOnly) return;
        try {
            await updateOrder({ descuento }, { onSuccess: invalidateOrder });
        } catch (error) {
            logUnexpectedError(error, "useTakeOrder.updateOrderDiscount");
            toast.error("Error al aplicar descuento");
        }
    };

    const updateProductDiscount = async (
        orderProductId: number,
        descuento: number,
    ) => {
        if (isReadOnly) return;
        try {
            await updateProduct(
                { orderProductId, data: { descuento } },
                { onSuccess: invalidateOrder },
            );
        } catch (error) {
            logUnexpectedError(error, "useTakeOrder.updateProductDiscount");
            toast.error("Error al aplicar descuento");
        }
    };

    const orderDiscount = order?.descuento ?? 0;
    const { cartCount, subtotal, total } = calcCartTotals(cart, orderDiscount);

    return {
        orderId,
        order,
        loadingOrder,
        loadingCart: loadingOrder,
        isReadOnly,
        cart,
        cartCount,
        subtotal,
        orderDiscount,
        total,
        pendingProductIds,
        addToCart,
        addExtra,
        updateQuantity,
        saveObservacion,
        removeFromCart,
        clearCart,
        updateOrderDiscount,
        updateProductDiscount,
    };
};
