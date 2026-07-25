import { toast } from "react-toastify";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { useUpdateOrder, useUpdateProductInOrder } from "@/services/useOrderService";
import { useInvalidateOrder } from "./useInvalidateOrder";

export const useOrderDiscounts = (orderId: number, isReadOnly: boolean) => {
    const invalidateOrder = useInvalidateOrder(orderId);
    const { mutateAsync: updateOrder } = useUpdateOrder(orderId);
    const { mutateAsync: updateProduct } = useUpdateProductInOrder(orderId);

    const updateOrderDiscount = async (descuento: number) => {
        if (isReadOnly) return;
        try {
            await updateOrder({ descuento }, { onSuccess: invalidateOrder });
        } catch (error) {
            logUnexpectedError(error, "useOrderDiscounts.updateOrderDiscount");
            toast.error(getUserFacingErrorMessage(error, "Error al aplicar descuento"));
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
            logUnexpectedError(error, "useOrderDiscounts.updateProductDiscount");
            toast.error(getUserFacingErrorMessage(error, "Error al aplicar descuento"));
        }
    };

    return { updateOrderDiscount, updateProductDiscount };
};
