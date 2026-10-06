import { useState } from "react";
import { IOrder } from "@/models/IOrder";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";

// Un apartado activo arranca desplegado (es el que se gestiona); los liquidados y cancelados
// arrancan colapsados para que la lista siga siendo corta cuando el historial crezca.
export const useCustomerLayawayItem = (order: IOrder) => {
    const isActive = order.estatus_pedido_id === OrderStatusEnum.Layaway;
    const [isExpanded, setIsExpanded] = useState(isActive);

    return {
        isActive,
        isExpanded,
        toggle: () => setIsExpanded((expanded) => !expanded),
    };
};
