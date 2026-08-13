import { useEffect, useState } from "react";
import { useIndexPaymentMethods } from "@/services/usePaymentMethodService";
import { resolveDefaultPaymentMethodId } from "@/utils/paymentMethods";

// Captura de efectivo y elección del método de pago (independiente de si la venta termina
// siendo a crédito — ver useCreditPayment.ts).
export const usePaymentMethod = (total: number) => {
    const { data: paymentMethods = [] } = useIndexPaymentMethods();
    const [cash, setCash] = useState("");
    const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);

    // Preselecciona "Efectivo" (método más usado) en cuanto se cargan los métodos de pago —
    // se re-ejecuta después de cada venta porque handlePay resetea paymentMethodId a null.
    useEffect(() => {
        if (paymentMethodId !== null || paymentMethods.length === 0) return;
        setPaymentMethodId(resolveDefaultPaymentMethodId(paymentMethods));
    }, [paymentMethods, paymentMethodId]);

    const cashNum = parseFloat(cash) || 0;
    const change = cashNum - total;
    const selectedPaymentMethod = paymentMethods.find((m) => m.id === paymentMethodId) ?? null;
    const isCashMethod = !selectedPaymentMethod || selectedPaymentMethod.name.toLowerCase().includes("efectivo");

    return {
        paymentMethods,
        paymentMethodId,
        setPaymentMethodId,
        cash,
        setCash,
        cashNum,
        change,
        isCashMethod,
    };
};
