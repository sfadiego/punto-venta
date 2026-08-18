import { useState } from "react";
import { IOrder } from "@/models/IOrder";
import { useShowOrder } from "@/services/useOrderService";

// La fila del listado no trae order_products (la query paginada no los carga) — al abrir el
// modal se pide el detalle completo por separado, solo para esa orden.
export const useOrderDetailModal = () => {
    const [order, setOrder] = useState<IOrder | null>(null);
    const { data: orderDetail, isFetching: isLoadingProducts } = useShowOrder(order?.id ?? 0);

    return {
        isOpen: !!order,
        order,
        orderProducts: orderDetail?.order_products ?? [],
        isLoadingProducts,
        open: (o: IOrder) => setOrder(o),
        close: () => setOrder(null),
    };
};
