import { NavigateFunction } from "react-router-dom";
import { IOrder } from "@/models/IOrder";
import { IModalCartItem } from "@/models/IModalCartItem";
import { useResumeOrder } from "./useResumeOrder";
import { usePrintOrder } from "./usePrintOrder";

interface UseQuickSaleOrderLifecycleParams {
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

export const useQuickSaleOrderLifecycle = (params: UseQuickSaleOrderLifecycleParams) => {
    const resumeOrder = useResumeOrder(params);
    const print = usePrintOrder({
        resumeOrderId: params.resumeOrderId,
        createOrderFromCart: resumeOrder.createOrderFromCart,
        navigate: params.navigate,
    });

    return { ...resumeOrder, ...print };
};
