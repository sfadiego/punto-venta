import { useState } from "react";
import { toast } from "react-toastify";
import { useOptimisticPendingSet } from "@/hooks/useOptimisticPendingSet";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { useCreateOrderProduct, useUpdateOrderProduct, useDeleteOrderItem, useClearOrderCart } from "@/services/useOrderService";
import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";
import { IOrderProduct } from "@/models/IOrderProduct";
import { UNIDAD_LABELS } from "@/enums/UnidadMedidaEnum";
import { IModalCartItem } from "@/models/IModalCartItem";
import { getAvailableStock } from "@/utils/stock";
import { useInvalidateResumeOrderQueries } from "./useInvalidateResumeOrderQueries";
import { useTicketDrawer } from "./useTicketDrawer";
import { useLastAddedFlash } from "./useLastAddedFlash";
import { MAX_CANTIDAD_KG } from "./quickSaleConstants";

// Estado del carrito y su sincronización con el backend. Cuando se está retomando una orden
// (resumeOrderId), cada add/remove/clear pega al servidor de inmediato en vez de esperar a
// guardar/cobrar — en una venta nueva es puro estado local hasta el checkout. El stock del
// catálogo no cambia con estos movimientos (solo se descuenta al cerrar la orden — ver
// useQuickSalePayment.ts), así que aquí no hace falta invalidar la query de productos.
export const useQuickSaleCart = (resumeOrderId: number | null) => {
    const invalidateResumeOrderQueries = useInvalidateResumeOrderQueries(resumeOrderId);
    const [cart, setCart] = useState<IModalCartItem[]>([]);
    const { lastAddedOrderProductId, flashLastAdded } = useLastAddedFlash();
    const { isDrawerOpen, toggleDrawer } = useTicketDrawer(cart.length);

    const { mutateAsync: createOrderProduct } = useCreateOrderProduct();
    const { mutateAsync: updateOrderProduct } = useUpdateOrderProduct();
    const { mutateAsync: deleteOrderItem } = useDeleteOrderItem();
    const { mutateAsync: clearOrderCart } = useClearOrderCart();

    // Evita la carrera de doble-tap: dos toques casi simultáneos sobre el mismo producto
    // leerían el mismo `cart` desde el closure y el segundo request pisaría al primero en
    // vez de sumarse (así apareció el precio desincronizado al retomar una orden editada
    // a toques rápidos).
    const { isPending: isAdding, withPending: withAdding } = useOptimisticPendingSet<number>();
    const { isPending: isRemoving, withPending: withRemoving } = useOptimisticPendingSet<number>();

    // Encuentra la línea del carrito de un producto, distinguiendo la línea del precio base
    // (variant = null/undefined) de la de una variante puntual (ej. "Pieza") — dos líneas del
    // mismo producto nunca se mezclan aunque coincida el precio.
    const findCartItem = (productId: number, variantId?: number | null) =>
        cart.find((item) => item.productId === productId && (item.variantId ?? null) === (variantId ?? null));

    const addToCart = async (product: IProduct, cantidadKg: number, variant: IProductVariant | null = null) => {
        if (cantidadKg <= 0) return;

        const existing = findCartItem(product.id, variant?.id);
        const unitLabel = UNIDAD_LABELS[product.unidad_medida] ?? "kg";
        const currentQty = existing?.cantidad ?? 0;
        const precioEfectivo = variant?.precio ?? product.precio;

        // No dejar reservar en el carrito más de lo que hay en existencia — el backend igual
        // lo bloquea al cerrar la venta. Sin toast aquí: la card (ProductCard) ya deshabilita
        // sus controles y muestra el aviso de stock inline cuando se llega al tope, así que en
        // flujo normal este bloque no debería alcanzarse — queda como respaldo silencioso.
        // Una línea de variante no descuenta stock (ver OrderSaleService), así que tampoco se
        // limita contra la existencia del producto base.
        if (!variant) {
            const availableStock = getAvailableStock(product);
            if (currentQty + cantidadKg > availableStock) {
                return;
            }
        }

        if (currentQty + cantidadKg > MAX_CANTIDAD_KG) {
            toast.error(`No puedes agregar más de ${MAX_CANTIDAD_KG} ${unitLabel} de ${product.nombre}.`);
            return;
        }

        if (resumeOrderId) {
            if (isAdding(product.id)) return;
            try {
                await withAdding([product.id], async () => {
                    const existing = findCartItem(product.id, variant?.id);
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
                        flashLastAdded(existing.orderProductId);
                    } else {
                        const res = await createOrderProduct({
                            orderId: resumeOrderId,
                            data: {
                                producto_id: product.id,
                                variant_id: variant?.id ?? null,
                                cantidad: cantidadKg,
                                precio: precioEfectivo,
                            },
                        });
                        const orderProduct = (res as { data: { data: IOrderProduct } }).data.data;
                        setCart((prev) => [
                            ...prev,
                            {
                                orderProductId: orderProduct.id!,
                                productId: product.id,
                                product,
                                cantidad: cantidadKg,
                                precioEfectivo,
                                variantId: variant?.id ?? null,
                                variantName: variant?.nombre ?? null,
                            },
                        ]);
                        flashLastAdded(orderProduct.id!);
                    }
                });
                invalidateResumeOrderQueries();
            } catch (error) {
                logUnexpectedError(error, "useQuickSaleCart.addToCart");
                toast.error(getUserFacingErrorMessage(error, "Error al agregar el producto."));
            }
            return;
        }

        const orderProductId = existing?.orderProductId ?? Date.now() + Math.random();

        setCart((prev) => {
            const idx = prev.findIndex(
                (item) => item.productId === product.id && (item.variantId ?? null) === (variant?.id ?? null),
            );
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], cantidad: next[idx].cantidad + cantidadKg };
                return next;
            }
            return [
                ...prev,
                {
                    orderProductId,
                    productId: product.id,
                    product,
                    cantidad: cantidadKg,
                    precioEfectivo,
                    variantId: variant?.id ?? null,
                    variantName: variant?.nombre ?? null,
                },
            ];
        });
        flashLastAdded(orderProductId);
    };

    // Quita una unidad del producto (botón "-" de UnitControls, solo productos por unidad).
    // Si la cantidad llega a 0 elimina la línea, igual que removeFromCart.
    const decrementFromCart = async (product: IProduct, variant: IProductVariant | null = null) => {
        const existing = findCartItem(product.id, variant?.id);
        if (!existing) return;

        if (resumeOrderId) {
            if (isRemoving(existing.orderProductId) || isAdding(product.id)) return;
            try {
                await withRemoving([existing.orderProductId], async () => {
                    if (existing.cantidad <= 1) {
                        await deleteOrderItem({ orderId: resumeOrderId, orderProductId: existing.orderProductId });
                        setCart((prev) => prev.filter((item) => item.orderProductId !== existing.orderProductId));
                    } else {
                        const newQty = existing.cantidad - 1;
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
                    }
                });
                invalidateResumeOrderQueries();
            } catch (error) {
                logUnexpectedError(error, "useQuickSaleCart.decrementFromCart");
                toast.error(getUserFacingErrorMessage(error, "Error al quitar el producto."));
            }
            return;
        }

        setCart((prev) => {
            if (existing.cantidad <= 1) {
                return prev.filter((item) => item.orderProductId !== existing.orderProductId);
            }
            return prev.map((item) =>
                item.orderProductId === existing.orderProductId ? { ...item, cantidad: item.cantidad - 1 } : item,
            );
        });
    };

    // Reemplaza (no suma) la cantidad de una línea ya en el carrito — usado por la edición
    // inline de peso en TicketRow para corregir un peso mal leído/agregado sin borrar y
    // volver a agregar el producto desde cero.
    const setLineWeight = async (orderProductId: number, weightKg: number) => {
        if (weightKg <= 0) return;
        const existing = cart.find((item) => item.orderProductId === orderProductId);
        if (!existing) return;

        const availableStock = getAvailableStock(existing.product);
        if (weightKg > availableStock || weightKg > MAX_CANTIDAD_KG) return;

        if (resumeOrderId) {
            if (isRemoving(orderProductId) || isAdding(existing.productId)) return;
            try {
                await withRemoving([orderProductId], async () => {
                    await updateOrderProduct({
                        orderId: resumeOrderId,
                        orderProductId,
                        data: { cantidad: weightKg, precio: existing.precioEfectivo },
                    });
                    setCart((prev) =>
                        prev.map((item) => (item.orderProductId === orderProductId ? { ...item, cantidad: weightKg } : item)),
                    );
                });
                invalidateResumeOrderQueries();
            } catch (error) {
                logUnexpectedError(error, "useQuickSaleCart.setLineWeight");
                toast.error(getUserFacingErrorMessage(error, "Error al actualizar el peso."));
            }
            return;
        }

        setCart((prev) =>
            prev.map((item) => (item.orderProductId === orderProductId ? { ...item, cantidad: weightKg } : item)),
        );
    };

    // Cantidad actual en el carrito para un producto por unidad (UnitControls la usa para
    // decidir entre mostrar el botón "+" inicial o el stepper con "-").
    const quantityOf = (product: IProduct, variant: IProductVariant | null = null) =>
        findCartItem(product.id, variant?.id)?.cantidad ?? 0;

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

    return {
        cart,
        setCart,
        addToCart,
        decrementFromCart,
        setLineWeight,
        quantityOf,
        removeFromCart,
        clearCart,
        isDrawerOpen,
        toggleDrawer,
        lastAddedOrderProductId,
    };
};
