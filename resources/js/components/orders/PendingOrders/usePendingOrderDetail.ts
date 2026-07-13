import { useState } from "react";
import { useIndexOrderProducts } from "@/services/useOrderService";
import { IOrderProduct } from "@/models/IOrderProduct";

export const usePendingOrderDetail = (orderId: number) => {
    const [expanded, setExpanded] = useState(false);

    const { data: products, isLoading } = useIndexOrderProducts(expanded ? orderId : 0);

    const toggle = () => setExpanded((v) => !v);

    return {
        expanded,
        toggle,
        products: (products as IOrderProduct[] | undefined) ?? [],
        isLoading,
    };
};
