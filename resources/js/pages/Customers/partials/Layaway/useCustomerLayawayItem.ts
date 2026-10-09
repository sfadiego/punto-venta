import { useState } from "react";
import { IOrder } from "@/models/IOrder";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";

// Productos que se muestran en línea antes de ofrecer "Ver todos".
const PREVIEW_COUNT = 3;

// Un apartado activo arranca desplegado (es el que se gestiona); los liquidados y cancelados
// arrancan colapsados para que la lista siga siendo corta cuando el historial crezca.
export const useCustomerLayawayItem = (order: IOrder) => {
    const isActive = order.estatus_pedido_id === OrderStatusEnum.Layaway;
    const [isExpanded, setIsExpanded] = useState(isActive);
    const [isProductsOpen, setIsProductsOpen] = useState(false);

    const products = order.order_products ?? [];

    return {
        isActive,
        isExpanded,
        toggle: () => setIsExpanded((expanded) => !expanded),
        products,
        // Con pocos productos se listan todos en línea; con más, solo los primeros y el resto en el modal.
        previewProducts: products.slice(0, PREVIEW_COUNT),
        hasMoreProducts: products.length > PREVIEW_COUNT,
        isProductsOpen,
        openProducts: () => setIsProductsOpen(true),
        closeProducts: () => setIsProductsOpen(false),
    };
};
