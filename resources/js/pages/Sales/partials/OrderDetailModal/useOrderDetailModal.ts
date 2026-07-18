import { useState } from "react";
import { IOrder } from "@/models/IOrder";

export const useOrderDetailModal = () => {
    const [order, setOrder] = useState<IOrder | null>(null);

    return {
        isOpen: !!order,
        order,
        open: (o: IOrder) => setOrder(o),
        close: () => setOrder(null),
    };
};
