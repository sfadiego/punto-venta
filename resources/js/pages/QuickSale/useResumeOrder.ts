import { useCallback, useEffect, useRef, useState } from "react";
import { NavigateFunction } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useShowOrder, useStoreOrder, useCreateOrderProduct, useUpdateOrderData } from "@/services/useOrderService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { resolveSaleName } from "@/utils/resolveSaleName";
import { calcCostoDomicilio } from "@/utils/deliveryCalc";
import { buildModalCartItems } from "@/utils/sellByWeightCartCalc";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { IOrder } from "@/models/IOrder";
import { IModalCartItem } from "@/models/IModalCartItem";
import { useInvalidateResumeOrderQueries } from "./useInvalidateResumeOrderQueries";

interface UseResumeOrderParams {
    resumeOrderId: number | null;
    sistemaId: number | null;
    cart: IModalCartItem[];
    setCart: (cart: IModalCartItem[]) => void;
    domicilioActivo: boolean;
    domicilioNum: number;
    customerPays: boolean;
    applyDeliveryFromOrder: (order: IOrder) => void;
    resetDelivery: () => void;
    navigate: NavigateFunction;
}

// Retomar una venta guardada (InProcess) — /quick-sale/:id — y el flujo de "guardar y continuar
// después" al presionar volver. El flujo de impresión (que también puede necesitar crear la
// orden) vive aparte en usePrintOrder.ts — ver createOrderFromCart, expuesto para que lo use.
export const useResumeOrder = ({
    resumeOrderId,
    sistemaId,
    cart,
    setCart,
    domicilioActivo,
    domicilioNum,
    customerPays,
    applyDeliveryFromOrder,
    resetDelivery,
    navigate,
}: UseResumeOrderParams) => {
    const invalidateResumeOrderQueries = useInvalidateResumeOrderQueries(resumeOrderId);
    const { data: resumeOrder, isLoading: loadingResumeOrder } = useShowOrder(resumeOrderId ?? 0);
    const resumeInitializedRef = useRef(false);

    const { mutateAsync: storeOrder } = useStoreOrder();
    const { mutateAsync: createOrderProduct } = useCreateOrderProduct();
    const { mutateAsync: updateOrderData } = useUpdateOrderData();

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
        });
        const order = (res as { data: { data: IOrder } }).data.data;

        for (const item of cart) {
            await createOrderProduct({
                orderId: order.id,
                data: { producto_id: item.productId, cantidad: item.cantidad, precio: item.precioEfectivo },
            });
        }

        if (domicilioActivo) {
            await updateOrderData({
                orderId: order.id,
                data: {
                    is_delivery: true,
                    costo_domicilio: calcCostoDomicilio(domicilioNum, domicilioActivo, customerPays),
                },
            });
        }

        return order.id;
    };

    // Guardar y continuar después.
    const saveCartAsInProcess = async () => {
        if (resumeOrderId) {
            // El carrito y el domicilio ya se sincronizaron acción por acción mientras se editaba
            // (addToCart/removeFromCart/clearCart/toggleDelivery/etc.) — aquí solo queda fijar
            // nombre/domicilio por si quedó algo sin blur (ej. el input de costo a medio escribir).
            await updateOrderData({
                orderId: resumeOrderId,
                data: {
                    nombre_pedido: resolveSaleName(nombrePedido),
                    is_delivery: domicilioActivo,
                    costo_domicilio: calcCostoDomicilio(domicilioNum, domicilioActivo, customerPays),
                },
            });
            invalidateResumeOrderQueries();
            return;
        }

        await createOrderFromCart();
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
            // Descartar cancela la salida: se queda en la pantalla, revirtiendo el estado local
            // sin tocar lo que ya se sincronizó en el servidor. Al retomar, vuelve a lo último
            // realmente guardado (no a vacío) — en venta nueva, sí arranca de cero.
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
        createOrderFromCart,
    };
};
