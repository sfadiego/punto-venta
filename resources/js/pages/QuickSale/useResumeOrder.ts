import { useCallback, useEffect, useRef, useState } from "react";
import { NavigateFunction } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useShowOrder, useStoreOrder, useCreateOrderProducts, useSyncOrderProducts, useUpdateOrderData } from "@/services/useOrderService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { resolveSaleName } from "@/utils/resolveSaleName";
import { buildModalCartItems, buildOrderItems, hasCartChanges } from "@/utils/sellByWeightCartCalc";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { IOrder } from "@/models/IOrder";
import { IOrderProduct } from "@/models/IOrderProduct";
import { IModalCartItem } from "@/models/IModalCartItem";
import { useWarnBeforeUnload } from "@/hooks/useWarnBeforeUnload";
import { useInvalidateResumeOrderQueries } from "./useInvalidateResumeOrderQueries";

interface UseResumeOrderParams {
    resumeOrderId: number | null;
    sistemaId: number | null;
    cart: IModalCartItem[];
    setCart: (cart: IModalCartItem[]) => void;
    deliveryPayload: { is_delivery: boolean; costo_domicilio: number };
    applyDeliveryFromOrder: (order: IOrder) => void;
    resetDelivery: () => void;
    navigate: NavigateFunction;
}

// Retomar una venta guardada (InProcess) — /quick-sale/:id — y el flujo de "guardar y continuar
// después" al presionar volver. El flujo de impresión (que también puede necesitar crear la
// orden) vive aparte en usePrintOrder.ts, que usa persistCart.
export const useResumeOrder = ({
    resumeOrderId,
    sistemaId,
    cart,
    setCart,
    deliveryPayload,
    applyDeliveryFromOrder,
    resetDelivery,
    navigate,
}: UseResumeOrderParams) => {
    const invalidateResumeOrderQueries = useInvalidateResumeOrderQueries(resumeOrderId);
    const { data: resumeOrder, isLoading: loadingResumeOrder } = useShowOrder(resumeOrderId ?? 0);
    const resumeInitializedRef = useRef(false);

    const { mutateAsync: storeOrder } = useStoreOrder();
    const { mutateAsync: createOrderProducts } = useCreateOrderProducts();
    const { mutateAsync: syncOrderProducts } = useSyncOrderProducts();
    const { mutateAsync: updateOrderData } = useUpdateOrderData();

    // En una venta retomada los cambios del carrito solo viven en memoria hasta guardar, imprimir o
    // cobrar: avisar antes de cerrar o recargar la pestaña con cambios sin guardar.
    useWarnBeforeUnload(!!resumeOrder && hasCartChanges(cart, buildModalCartItems(resumeOrder.order_products)));

    const [nombrePedido, setNombrePedido] = useState("");
    const [isSavingOrder, setIsSavingOrder] = useState(false);

    const handleNombrePedidoBlur = () => {
        if (!resumeOrderId || !nombrePedido.trim()) return;
        updateOrderData({
            orderId: resumeOrderId,
            data: { nombre_pedido: nombrePedido.trim() },
        })
            .then(invalidateResumeOrderQueries)
            .catch((error) => logUnexpectedError(error, "useResumeOrder.handleNombrePedidoBlur"));
    };

    // Puebla carrito/domicilio/nombre desde una orden. Se reutiliza tanto al cargar la orden
    // retomada como al "Descartar" (revierte a lo último realmente guardado).
    const applyOrderState = useCallback(
        (order: IOrder) => {
            setCart(buildModalCartItems(order.order_products));
            setNombrePedido(order.nombre_pedido ?? "");
            applyDeliveryFromOrder(order);
        },
        [setCart, applyDeliveryFromOrder],
    );

    useEffect(() => {
        if (!resumeOrder || !resumeOrderId || resumeInitializedRef.current) return;
        resumeInitializedRef.current = true;
        applyOrderState(resumeOrder);
    }, [resumeOrder, resumeOrderId, applyOrderState]);

    // Crea la orden InProcess con el carrito/domicilio actual para que quede
    // visible/retomable en "Ventas del día". También la usa usePrintOrder cuando se imprime
    // sin haber guardado aún.
    const createOrderFromCart = async (): Promise<number> => {
        const res = await storeOrder({
            nombre_pedido: resolveSaleName(nombrePedido),
            total: 0,
            subtotal: 0,
            descuento: 0,
            sistema_id: sistemaId,
            estatus_pedido_id: OrderStatusEnum.InProcess,
            silent: true,
        });
        const order = (res as { data: { data: IOrder } }).data.data;

        // Un solo request con todo el carrito (ver useCreateOrderProducts/
        // OrderProductService::addProducts) en vez de un POST secuencial por línea — con
        // carritos de varias líneas y muchos cajeros cobrando a la vez, esto evitaba que el
        // checkout formara fila N veces por el pool de PHP-FPM en vez de una sola.
        if (cart.length > 0) {
            await createOrderProducts({
                orderId: order.id,
                items: buildOrderItems(cart),
            });
        }

        if (deliveryPayload.is_delivery) {
            await updateOrderData({ orderId: order.id, data: deliveryPayload });
        }

        return order.id;
    };

    // Deja la orden en el servidor igual al carrito local y devuelve su id: la crea si todavía no
    // existe, o sincroniza sus líneas si ya estaba guardada (retomada). El carrito solo viaja al
    // servidor aquí (guardar, imprimir, cobrar), no en cada toque. Al terminar el carrito local
    // toma los ids que asignó el servidor, para que el siguiente sync reconozca esas líneas.
    const persistCart = async (): Promise<number> => {
        if (!resumeOrderId) return createOrderFromCart();

        const response = await syncOrderProducts({
            orderId: resumeOrderId,
            items: buildOrderItems(cart).map((item, index) => ({ ...item, order_product_id: cart[index].orderProductId })),
        });
        setCart(buildModalCartItems((response as { data: { data: IOrderProduct[] } }).data.data));
        invalidateResumeOrderQueries();
        return resumeOrderId;
    };

    // Guardar y continuar después.
    const saveCartAsInProcess = async () => {
        await persistCart();

        // Una orden nueva ya salió con nombre y domicilio (createOrderFromCart); en una retomada
        // hay que fijarlos por si quedó algo sin blur (ej. el input de costo a medio escribir).
        if (resumeOrderId) {
            await updateOrderData({
                orderId: resumeOrderId,
                data: {
                    nombre_pedido: resolveSaleName(nombrePedido),
                    ...deliveryPayload,
                },
            });
            invalidateResumeOrderQueries();
        }
    };

    const handleBack = async () => {
        // En una venta nueva sin productos no hay nada que guardar. Pero si se está retomando
        // una orden ya guardada, aunque el carrito quede en 0 (ej. tras "Vaciar ticket") hay que
        // pasar por el diálogo para sincronizar ese vaciado contra el servidor — si no, la orden
        // se queda con sus productos viejos y reaparecen la próxima vez que se retome.
        if (!resumeOrderId && cart.length === 0) {
            navigate(AdminRoutes.Dashboard);
            return;
        }

        const result = await Swal.fire({
            title: "¿Guardar esta venta?",
            text: cart.length === 0
                ? "Quitaste todos los productos de esta venta guardada. Puedes guardar el cambio o descartarlo."
                : "Tienes productos sin cobrar. Puedes guardarla para continuarla después o descartarla.",
            icon: "question",
            showDenyButton: true,
            confirmButtonText: "Guardar",
            denyButtonText: "Descartar",
            confirmButtonColor: "#f59e0b",
            denyButtonColor: "#dc2626",
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            setIsSavingOrder(true);
            try {
                await saveCartAsInProcess();
                toast.success("Venta guardada. Puedes continuarla desde el dashboard.");
                setCart([]);
                setNombrePedido("");
                navigate(AdminRoutes.Dashboard);
            } catch (error) {
                logUnexpectedError(error, "useResumeOrder.saveCartAsInProcess");
                toast.error(getUserFacingErrorMessage(error, "No se pudo guardar la venta."));
            } finally {
                setIsSavingOrder(false);
            }
        } else if (result.isDenied) {
            // Descartar cancela la salida: se queda en la pantalla y revierte el carrito a lo último
            // realmente guardado en el servidor (no a vacío) — en venta nueva, sí arranca de cero.
            if (resumeOrderId && resumeOrder) {
                applyOrderState(resumeOrder);
            } else {
                setCart([]);
                setNombrePedido("");
                resetDelivery();
            }
        }
    };

    return {
        loadingResumeOrder,
        nombrePedido,
        setNombrePedido,
        handleNombrePedidoBlur,
        isSavingOrder,
        handleBack,
        persistCart,
    };
};
