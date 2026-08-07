import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useOptimisticPendingSet } from "@/hooks/useOptimisticPendingSet";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { useCreateOrderProduct, useUpdateOrderProduct, useDeleteOrderItem, useClearOrderCart } from "@/services/useOrderService";
import { IProduct } from "@/models/IProduct";
import { IOrderProduct } from "@/models/IOrderProduct";
import { IModalCartItem } from "@/models/IModalCartItem";
import { useInvalidateResumeOrderQueries } from "./useInvalidateResumeOrderQueries";
import { MAX_CANTIDAD_KG } from "./quickSaleConstants";

// Estado del carrito y su sincronización con el backend. Cuando se está retomando una orden
// (resumeOrderId), cada add/remove/clear pega al servidor de inmediato en vez de esperar a
// guardar/cobrar — en una venta nueva es puro estado local hasta el checkout.
export const useQuickSaleCart = (resumeOrderId: number | null) => {
    const invalidateResumeOrderQueries = useInvalidateResumeOrderQueries(resumeOrderId);
    const [cart, setCart] = useState<IModalCartItem[]>([]);

    const { mutateAsync: createOrderProduct } = useCreateOrderProduct();
    const { mutateAsync: updateOrderProduct } = useUpdateOrderProduct();
    const { mutateAsync: deleteOrderItem } = useDeleteOrderItem();
    const { mutateAsync: clearOrderCart } = useClearOrderCart();

    // Evita la carrera de doble-tap: dos toques casi simultáneos sobre el mismo producto
    // leerían el mismo `cart` desde el closure y el segundo request pisaría al primero en
    // vez de sumarse (así apareció el precio desincronizado al retomar una orden editada
    // a toques rápidos). Mismo patrón que useSellByWeightSaleModal (isAdding/withAdding).
    const { isPending: isAdding, withPending: withAdding } = useOptimisticPendingSet<number>();
    const { isPending: isRemoving, withPending: withRemoving } = useOptimisticPendingSet<number>();

    const addToCart = async (product: IProduct, cantidadKg: number) => {
        if (cantidadKg <= 0) return;

        const existing = cart.find(
            (item) => item.productId === product.id && item.precioEfectivo === product.precio,
        );
        if ((existing?.cantidad ?? 0) + cantidadKg > MAX_CANTIDAD_KG) {
            toast.error(`No puedes agregar más de ${MAX_CANTIDAD_KG} kg de ${product.nombre}.`);
            return;
        }

        if (resumeOrderId) {
            if (isAdding(product.id)) return;
            try {
                await withAdding([product.id], async () => {
                    const existing = cart.find(
                        (item) => item.productId === product.id && item.precioEfectivo === product.precio,
                    );
                    if (existing) {
                        const newQty = existing.cantidad + cantidadKg;
                        await updateOrderProduct({
                            orderId: resumeOrderId,
                            orderProductId: existing.orderProductId,
                            data: { cantidad: newQty, precio: existing.precioEfectivo },
                        });
                        setCart((prev) =>
                            prev.map((item) =>
                                item.orderProductId === existing.orderProductId ? { ...item, cantidad: newQty } : item,
                            ),
                        );
                    } else {
                        const res = await createOrderProduct({
                            orderId: resumeOrderId,
                            data: { producto_id: product.id, cantidad: cantidadKg, precio: product.precio },
                        });
                        const orderProduct = (res as { data: { data: IOrderProduct } }).data.data;
                        setCart((prev) => [
                            ...prev,
                            {
                                orderProductId: orderProduct.id!,
                                productId: product.id,
                                product,
                                cantidad: cantidadKg,
                                precioEfectivo: product.precio,
                            },
                        ]);
                    }
                });
                invalidateResumeOrderQueries();
            } catch (error) {
                logUnexpectedError(error, "useQuickSaleCart.addToCart");
                toast.error(getUserFacingErrorMessage(error, "Error al agregar el producto."));
            }
            return;
        }

        setCart((prev) => {
            const idx = prev.findIndex(
                (item) => item.productId === product.id && item.precioEfectivo === product.precio,
            );
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], cantidad: next[idx].cantidad + cantidadKg };
                return next;
            }
            return [
                ...prev,
                {
                    orderProductId: Date.now() + Math.random(),
                    productId: product.id,
                    product,
                    cantidad: cantidadKg,
                    precioEfectivo: product.precio,
                },
            ];
        });
    };

    const removeFromCart = async (orderProductId: number) => {
        if (resumeOrderId) {
            if (isRemoving(orderProductId)) return;
            try {
                await withRemoving([orderProductId], async () => {
                    await deleteOrderItem({ orderId: resumeOrderId, orderProductId });
                    setCart((prev) => prev.filter((item) => item.orderProductId !== orderProductId));
                });
                invalidateResumeOrderQueries();
            } catch (error) {
                logUnexpectedError(error, "useQuickSaleCart.removeFromCart");
                toast.error(getUserFacingErrorMessage(error, "Error al quitar el producto."));
            }
            return;
        }
        setCart((prev) => prev.filter((item) => item.orderProductId !== orderProductId));
    };

    // Vacía el ticket — usada por el botón "Vaciar ticket". Sincroniza contra el servidor solo
    // cuando se está retomando una orden; en una venta nueva es puro estado local, como antes.
    const clearCart = async () => {
        if (resumeOrderId) {
            if (cart.length === 0) return;
            try {
                await clearOrderCart(resumeOrderId);
                setCart([]);
                invalidateResumeOrderQueries();
            } catch (error) {
                logUnexpectedError(error, "useQuickSaleCart.clearCart");
                toast.error(getUserFacingErrorMessage(error, "Error al vaciar el ticket."));
            }
            return;
        }
        setCart([]);
    };

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);
    const prevCartLengthRef = useRef(0);

    // El ticket se abre solo al agregar el primer producto y se cierra solo al vaciarse;
    // el usuario puede seguir colapsándolo manualmente mientras haya artículos.
    useEffect(() => {
        if (cart.length === 0) {
            setIsDrawerOpen(false);
        } else if (prevCartLengthRef.current === 0) {
            setIsDrawerOpen(true);
        }
        prevCartLengthRef.current = cart.length;
    }, [cart.length]);

    return { cart, setCart, addToCart, removeFromCart, clearCart, isDrawerOpen, toggleDrawer };
};
