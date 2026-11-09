import { reportActionError } from "@/utils/reportActionError";
import { useUpdateOrder, useUpdateProductInOrder } from "@/services/useOrderService";
import { useInvalidateOrder } from "./useInvalidateOrder";

// resolveOrderProductId: envía lo pendiente de la línea y devuelve su id real (null si ya no
// existe) — una línea recién agregada puede seguir con id temporal cuando se edita su descuento.
export const useOrderDiscounts = (
    orderId: number,
    isReadOnly: boolean,
    resolveOrderProductId: (orderProductId: number) => Promise<number | null>,
) => {
    const invalidateOrder = useInvalidateOrder(orderId);
    const { mutateAsync: updateOrder } = useUpdateOrder(orderId);
    const { mutateAsync: updateProduct } = useUpdateProductInOrder(orderId);

    const updateOrderDiscount = async (descuento: number) => {
        if (isReadOnly) return;
        try {
            await updateOrder({ descuento }, { onSuccess: invalidateOrder });
        } catch (error) {
            reportActionError(error, "useOrderDiscounts.updateOrderDiscount", "Error al aplicar descuento");
        }
    };

    const updateProductDiscount = async (
        orderProductId: number,
        descuento: number,
    ) => {
        if (isReadOnly) return;
        try {
            const realOrderProductId = await resolveOrderProductId(orderProductId);
            if (realOrderProductId === null) return;
            await updateProduct(
                { orderProductId: realOrderProductId, data: { descuento } },
                { onSuccess: invalidateOrder },
            );
        } catch (error) {
            reportActionError(error, "useOrderDiscounts.updateProductDiscount", "Error al aplicar descuento");
        }
    };

    return { updateOrderDiscount, updateProductDiscount };
};
