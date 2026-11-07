import { useState } from "react";
import { toast } from "react-toastify";
import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";
import { UNIDAD_LABELS } from "@/enums/UnidadMedidaEnum";
import { IModalCartItem } from "@/models/IModalCartItem";
import { getAvailableStockFor } from "@/utils/stock";
import { isWeightUnit } from "@/utils/weightUnits";
import { useTicketDrawer } from "./useTicketDrawer";
import { useLastAddedFlash } from "./useLastAddedFlash";
import { MAX_CANTIDAD_KG } from "./quickSaleConstants";

// Estado del carrito: puro estado local, sea una venta nueva o una retomada. Solo viaja al
// servidor al guardar, imprimir o cobrar (ver persistCart en useResumeOrder.ts). El stock del
// catálogo no cambia con estos movimientos (solo se descuenta al cerrar la orden — ver
// useQuickSalePayment.ts), así que aquí no hace falta invalidar la query de productos.
export const useQuickSaleCart = () => {
    const [cart, setCart] = useState<IModalCartItem[]>([]);
    const { lastAddedOrderProductId, flashLastAdded } = useLastAddedFlash();
    const { isDrawerOpen, toggleDrawer } = useTicketDrawer(cart.length);

    // Encuentra la línea del carrito de un producto, distinguiendo la línea del precio base
    // (variant = null/undefined) de la de una variante puntual (ej. "Pieza") — dos líneas del
    // mismo producto nunca se mezclan aunque coincida el precio.
    const findCartItem = (productId: number, variantId?: number | null) =>
        cart.find((item) => item.productId === productId && (item.variantId ?? null) === (variantId ?? null));

    const addToCart = (product: IProduct, cantidadKg: number, variant: IProductVariant | null = null) => {
        if (cantidadKg <= 0) return;

        const existing = findCartItem(product.id, variant?.id);
        const unitLabel = UNIDAD_LABELS[product.unidad_medida] ?? "kg";
        const currentQty = existing?.cantidad ?? 0;
        const precioEfectivo = variant?.precio ?? product.precio;

        // No dejar reservar en el carrito más de lo que hay en existencia — el backend igual
        // lo bloquea al cerrar la venta. Sin toast aquí: la card (ProductCard) ya deshabilita
        // sus controles y muestra el aviso de stock inline cuando se llega al tope, así que en
        // flujo normal este bloque no debería alcanzarse — queda como respaldo silencioso. Una
        // línea con variante topa contra el stock de esa variante, no el del producto base.
        const availableStock = getAvailableStockFor(product, variant?.id ?? null);
        if (currentQty + cantidadKg > availableStock) {
            return;
        }

        if (currentQty + cantidadKg > MAX_CANTIDAD_KG) {
            toast.error(`No puedes agregar más de ${MAX_CANTIDAD_KG} ${unitLabel} de ${product.nombre}.`);
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
    const decrementFromCart = (product: IProduct, variant: IProductVariant | null = null) => {
        const existing = findCartItem(product.id, variant?.id);
        if (!existing) return;

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
    // inline en TicketRow (peso o cantidad por unidad, según el producto) para corregir un
    // valor mal leído/agregado sin borrar y volver a agregar el producto desde cero. Las
    // líneas por unidad solo aceptan enteros — la UI ya valida esto, pero se repite aquí como
    // última barrera antes de mutar el carrito.
    const setLineQuantity = (orderProductId: number, cantidad: number) => {
        const existing = cart.find((item) => item.orderProductId === orderProductId);
        if (!existing) return;
        if (cantidad <= 0) return;
        if (!isWeightUnit(existing.product.unidad_medida) && !Number.isInteger(cantidad)) return;

        const unitLabel = isWeightUnit(existing.product.unidad_medida)
            ? UNIDAD_LABELS[existing.product.unidad_medida]
            : "und";
        const availableStock = getAvailableStockFor(existing.product, existing.variantId);
        if (cantidad > availableStock) {
            toast.error(`Solo hay ${availableStock} ${unitLabel} disponibles de ${existing.product.nombre}.`);
            return;
        }
        if (cantidad > MAX_CANTIDAD_KG) {
            toast.error(`No puedes agregar más de ${MAX_CANTIDAD_KG} ${unitLabel} de ${existing.product.nombre}.`);
            return;
        }

        setCart((prev) =>
            prev.map((item) => (item.orderProductId === orderProductId ? { ...item, cantidad } : item)),
        );
    };

    // Cantidad actual en el carrito para un producto por unidad (UnitControls la usa para
    // decidir entre mostrar el botón "+" inicial o el stepper con "-").
    const quantityOf = (product: IProduct, variant: IProductVariant | null = null) =>
        findCartItem(product.id, variant?.id)?.cantidad ?? 0;

    const removeFromCart = (orderProductId: number) =>
        setCart((prev) => prev.filter((item) => item.orderProductId !== orderProductId));

    // Vacía el ticket — usada por el botón "Vaciar ticket".
    const clearCart = () => setCart([]);

    return {
        cart,
        setCart,
        addToCart,
        decrementFromCart,
        setLineQuantity,
        quantityOf,
        removeFromCart,
        clearCart,
        isDrawerOpen,
        toggleDrawer,
        lastAddedOrderProductId,
    };
};
