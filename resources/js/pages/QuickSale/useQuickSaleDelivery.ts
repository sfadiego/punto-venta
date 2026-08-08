import { useState } from "react";
import { toast } from "react-toastify";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { useUpdateOrderData } from "@/services/useOrderService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { calcCostoDomicilio } from "@/utils/deliveryCalc";
import { DeliveryPaidByEnum } from "@/enums/DeliveryPaidByEnum";
import { IOrder } from "@/models/IOrder";
import { useInvalidateResumeOrderQueries } from "./useInvalidateResumeOrderQueries";

// Estado del domicilio. Solo pega al backend cuando se está retomando una orden — en una venta
// nueva el domicilio se manda entero recién al guardar/cobrar.
export const useQuickSaleDelivery = (resumeOrderId: number | null) => {
    const invalidateResumeOrderQueries = useInvalidateResumeOrderQueries(resumeOrderId);
    const { mutateAsync: updateOrderData } = useUpdateOrderData();
    const { data: businessConfig } = useGetBusinessConfig();

    const [domicilioActivo, setDomicilioActivo] = useState(false);
    const [costoDomicilio, setCostoDomicilio] = useState("");
    const [deliveryPaidBy, setDeliveryPaidBy] = useState<DeliveryPaidByEnum>(DeliveryPaidByEnum.Customer);

    const syncDeliveryToOrder = async (nextActivo: boolean, nextCosto: number, nextPaidBy: DeliveryPaidByEnum) => {
        if (!resumeOrderId) return;
        try {
            await updateOrderData({
                orderId: resumeOrderId,
                data: {
                    is_delivery: nextActivo,
                    costo_domicilio: calcCostoDomicilio(nextCosto, nextActivo, nextPaidBy === DeliveryPaidByEnum.Customer),
                },
            });
            invalidateResumeOrderQueries();
        } catch (error) {
            logUnexpectedError(error, "useQuickSaleDelivery.syncDeliveryToOrder");
            toast.error(getUserFacingErrorMessage(error, "No se pudo actualizar el domicilio."));
        }
    };

    const toggleDelivery = () => {
        setDomicilioActivo((prev) => {
            const next = !prev;
            let nextCosto = 0;
            let nextPaidBy = deliveryPaidBy;
            if (next) {
                // Precarga el costo configurado en Admin > Domicilio, solo si el negocio definió uno.
                const defaultCost = Number(businessConfig?.costo_domicilio_default ?? 0);
                nextCosto = defaultCost;
                setCostoDomicilio(defaultCost > 0 ? String(defaultCost) : "");
            } else {
                setCostoDomicilio("");
                setDeliveryPaidBy(DeliveryPaidByEnum.Customer);
                nextPaidBy = DeliveryPaidByEnum.Customer;
            }
            syncDeliveryToOrder(next, nextCosto, nextPaidBy);
            return next;
        });
    };

    const handleCostoDomicilioBlur = () => {
        if (!domicilioActivo) return;
        syncDeliveryToOrder(domicilioActivo, parseFloat(costoDomicilio) || 0, deliveryPaidBy);
    };

    const handleDeliveryPaidByChange = (value: DeliveryPaidByEnum) => {
        setDeliveryPaidBy(value);
        syncDeliveryToOrder(domicilioActivo, parseFloat(costoDomicilio) || 0, value);
    };

    const customerPays = deliveryPaidBy === DeliveryPaidByEnum.Customer;
    const domicilioNum = parseFloat(costoDomicilio) || 0;

    const resetDelivery = () => {
        setDomicilioActivo(false);
        setCostoDomicilio("");
        setDeliveryPaidBy(DeliveryPaidByEnum.Customer);
    };

    // Infiere domicilioActivo/customerPays desde costo_domicilio — mismo cálculo que
    // useSellByWeightSaleModal usa. Se reutiliza tanto al cargar la orden retomada como
    // al "Descartar" (revierte a lo último realmente guardado).
    const applyDeliveryFromOrder = (order: IOrder) => {
        const rawDomicilio = Number(order.costo_domicilio ?? 0);
        const amount = Math.abs(rawDomicilio);
        setDomicilioActivo(!!order.is_delivery || amount > 0);
        setCostoDomicilio(amount > 0 ? String(amount) : "");
        setDeliveryPaidBy(rawDomicilio >= 0 ? DeliveryPaidByEnum.Customer : DeliveryPaidByEnum.Business);
    };

    return {
        domicilioActivo,
        toggleDelivery,
        costoDomicilio,
        setCostoDomicilio,
        handleCostoDomicilioBlur,
        deliveryPaidBy,
        setDeliveryPaidBy: handleDeliveryPaidByChange,
        domicilioNum,
        customerPays,
        resetDelivery,
        applyDeliveryFromOrder,
    };
};
