import { useEffect, useRef, useState } from "react";
import { reportActionError } from "@/utils/reportActionError";
import { useUpdateOrder } from "@/services/useOrderService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { calcCostoDomicilio, parseOrderDelivery } from "@/utils/deliveryCalc";
import { DeliveryPaidByEnum } from "@/enums/DeliveryPaidByEnum";
import { IOrder } from "@/models/IOrder";
import { useInvalidateOrder } from "./useInvalidateOrder";

export type TOrderDelivery = ReturnType<typeof useOrderDelivery>;

export const useOrderDelivery = (
    orderId: number,
    order: IOrder | undefined,
    isReadOnly: boolean,
) => {
    const invalidateOrder = useInvalidateOrder(orderId);
    const { mutateAsync: updateOrder } = useUpdateOrder(orderId);
    const { data: businessConfig } = useGetBusinessConfig();

    const [domicilioActivo, setDomicilioActivo] = useState(false);
    const [costoDomicilio, setCostoDomicilio] = useState("");
    const [orderDeliveryPaidBy, setOrderDeliveryPaidByState] = useState<DeliveryPaidByEnum>(
        DeliveryPaidByEnum.Customer,
    );
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!order || initializedRef.current) return;
        initializedRef.current = true;
        const { isActive, amount, customerPays: paidByCustomer } = parseOrderDelivery(order);
        setDomicilioActivo(isActive);
        setCostoDomicilio(amount > 0 ? String(amount) : "");
        setOrderDeliveryPaidByState(paidByCustomer ? DeliveryPaidByEnum.Customer : DeliveryPaidByEnum.Business);
    }, [order]);

    const domicilio = parseFloat(costoDomicilio) || 0;
    const customerPays = orderDeliveryPaidBy === DeliveryPaidByEnum.Customer;

    const persist = async (nextDomicilio: number, nextActivo: boolean, nextCustomerPays: boolean) => {
        if (isReadOnly) return;
        try {
            await updateOrder(
                {
                    costo_domicilio: nextActivo ? calcCostoDomicilio(nextDomicilio, nextActivo, nextCustomerPays) : 0,
                    is_delivery: nextActivo,
                },
                { onSuccess: invalidateOrder },
            );
        } catch (error) {
            reportActionError(error, "useOrderDelivery.persist", "Error al guardar el domicilio");
        }
    };

    const toggleDomicilio = (checked: boolean) => {
        setDomicilioActivo(checked);
        if (checked) {
            const defaultCost = Number(businessConfig?.costo_domicilio_default ?? 0);
            const nextCost = defaultCost > 0 ? String(defaultCost) : "";
            setCostoDomicilio(nextCost);
            setOrderDeliveryPaidByState(DeliveryPaidByEnum.Customer);
            persist(parseFloat(nextCost) || 0, true, true);
        } else {
            setCostoDomicilio("");
            persist(0, false, customerPays);
        }
    };

    const handleCostoDomicilioBlur = () => {
        persist(domicilio, domicilioActivo, customerPays);
    };

    const setOrderDeliveryPaidBy = (value: DeliveryPaidByEnum) => {
        setOrderDeliveryPaidByState(value);
        persist(domicilio, domicilioActivo, value === DeliveryPaidByEnum.Customer);
    };

    return {
        domicilioActivo,
        toggleDomicilio,
        costoDomicilio,
        setCostoDomicilio,
        handleCostoDomicilioBlur,
        setOrderDeliveryPaidBy,
        domicilio,
        customerPays,
    };
};
