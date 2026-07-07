import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import {
    useShowOrder,
    useAddProductToOrder,
    useUpdateProductInOrder,
    useUpdateOrderProductNote,
    useDeleteItemFromOrder,
    useUpdateOrder,
} from "@/services/useOrderService";

export type CartItem = {
    orderProductId: number; // order_product.id — key for remove/update
    id: number | null;      // producto_id (null for extras)
    name: string;
    price: number;
    quantity: number;
    descuento: number;
    isExtra: boolean;
    observacion: string | null;
    isReady: boolean;
};

export const useTakeOrder = () => {
    const { id } = useParams<{ id: string }>();
    const orderId = Number(id);
    const queryClient = useQueryClient();

    const orderQueryKey = `${ApiRoutes.Orders}/${orderId}`;
    const invalidateOrder = () =>
        queryClient.invalidateQueries({ queryKey: [orderQueryKey] });

    const { data: order, isLoading: loadingOrder } = useShowOrder(orderId);

    const editableStatuses = [OrderStatusEnum.InProcess, OrderStatusEnum.Served];
    const isReadOnly = !!order && !editableStatuses.includes(order.estatus_pedido_id);

    const cart: CartItem[] = (order?.order_products ?? []).map((op) => ({
        orderProductId: op.id!,
        id: op.producto_id ?? null,
        name: op.nombre_extra ?? op.product?.nombre ?? "",
        price: op.precio,
        quantity: parseFloat(String(op.cantidad)),
        descuento: op.descuento ?? 0,
        isExtra: !op.producto_id,
        observacion: op.observacion ?? null,
        isReady: op.is_ready ?? false,
    }));

    const { mutateAsync: addProduct } = useAddProductToOrder(orderId);
    const { mutateAsync: updateProduct } = useUpdateProductInOrder(orderId);
    const { mutateAsync: updateNote } = useUpdateOrderProductNote(orderId);
    const { mutateAsync: deleteItem } = useDeleteItemFromOrder(orderId);
    const { mutateAsync: updateOrder } = useUpdateOrder(orderId);
    // Add regular product (click on ProductCard)
    const addToCart = async (productId: number, _name: string, price: number) => {
        if (isReadOnly) return;
        try {
            await addProduct(
                { producto_id: productId, cantidad: 1, precio: price, descuento: 0 },
                { onSuccess: invalidateOrder },
            );
        } catch {
            toast.error("Error al agregar producto");
        }
    };

    // Add custom extra (no producto_id)
    const addExtra = async (nombre: string, precio: number, cantidad: number) => {
        if (isReadOnly) return;
        try {
            await addProduct(
                { nombre_extra: nombre, cantidad, precio, descuento: 0 },
                { onSuccess: invalidateOrder },
            );
        } catch {
            toast.error("Error al agregar extra");
        }
    };

    // Update quantity — only valid for regular products
    const updateQuantity = async (productId: number, delta: number) => {
        if (isReadOnly) return;
        const existing = cart.find((item) => item.id === productId);
        if (!existing) return;
        const newQty = existing.quantity + delta;
        try {
            if (newQty <= 0) {
                await deleteItem(existing.orderProductId, { onSuccess: invalidateOrder });
            } else {
                await updateProduct(
                    { productId, data: { cantidad: newQty } },
                    { onSuccess: invalidateOrder },
                );
            }
        } catch {
            toast.error("Error al actualizar producto");
        }
    };

    // Save observation on any item (product or extra) by orderProductId
    const saveObservacion = async (orderProductId: number, observacion: string) => {
        if (isReadOnly) return;
        try {
            await updateNote(
                { orderProductId, observacion },
                { onSuccess: invalidateOrder },
            );
        } catch {
            toast.error("Error al guardar la observación");
        }
    };

    // Remove any item (product or extra) by orderProductId
    const removeFromCart = async (orderProductId: number) => {
        if (isReadOnly) return;
        try {
            await deleteItem(orderProductId, { onSuccess: invalidateOrder });
        } catch {
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
            deleteItem(item.orderProductId, { onSuccess: invalidateOrder }).catch(() =>
                toast.error("Error al limpiar pedido"),
            );
        });
    };

    const updateOrderDiscount = async (descuento: number) => {
        if (isReadOnly) return;
        try {
            await updateOrder({ descuento }, { onSuccess: invalidateOrder });
        } catch {
            toast.error("Error al aplicar descuento");
        }
    };

    const updateProductDiscount = async (productId: number, descuento: number) => {
        if (isReadOnly) return;
        try {
            await updateProduct(
                { productId, data: { descuento } },
                { onSuccess: invalidateOrder },
            );
        } catch {
            toast.error("Error al aplicar descuento");
        }
    };

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity * (1 - item.descuento / 100),
        0,
    );
    const orderDiscount = order?.descuento ?? 0;
    const total = subtotal * (1 - orderDiscount / 100);

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
