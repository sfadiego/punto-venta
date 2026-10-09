import { useState } from "react";
import { useAxios } from "@/hooks/useAxios";
import { usePermissions } from "@/hooks/usePermissions";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { IOrder } from "@/models/IOrder";
import { IOrderProduct } from "@/models/IOrderProduct";
import { hasReturnableLines } from "@/utils/returnCalc";
import { isReturnWindowOpen, returnWindowMessage } from "@/utils/returnWindow";

// La devolución es de retail, de una venta ya cerrada, y exige el permiso de devoluciones. Se bloquea
// cuando ya se devolvió todo o cuando pasó el plazo de devolución del negocio.
export const useOrderReturnButton = (order: IOrder, orderProducts: IOrderProduct[], isLoadingProducts: boolean) => {
    const { features } = useAxios();
    const { can } = usePermissions();
    const { data: config } = useGetBusinessConfig();
    const [isOpen, setIsOpen] = useState(false);

    const returnDays = config?.return_days ?? 0;
    const isExpired = !isReturnWindowOpen(order, returnDays);
    // Con las líneas ya cargadas y ninguna por devolver, la venta se devolvió por completo.
    const isFullyReturned = !isLoadingProducts && orderProducts.length > 0 && !hasReturnableLines(orderProducts);

    return {
        canReturn: features?.is_retail === true && can("processReturns") && order.estatus_pedido_id === OrderStatusEnum.Closed,
        isFullyReturned,
        isExpired,
        // Por qué está deshabilitado (undefined si no lo está por una de estas razones).
        disabledReason: isExpired ? returnWindowMessage(returnDays) : isFullyReturned ? "Esta venta ya se devolvió por completo" : undefined,
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
    };
};
