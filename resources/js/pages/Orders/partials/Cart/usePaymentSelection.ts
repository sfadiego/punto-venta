import { useState } from "react";
import { useIndexPaymentMethods } from "@/services/usePaymentMethodService";

// Efectivo/propina y elección del método de pago — independiente de si la venta termina
// siendo a crédito (ver useCreditSelection.ts). Mismo split de dominio que usePaymentMethod.ts
// en QuickSale; aquí el reset del estado lo dispara el hook que compone (usePayModal) cada vez
// que el modal se abre, en vez de un efecto de auto-preselección.
export const usePaymentSelection = (total: number) => {
    const { data: paymentMethods = [] } = useIndexPaymentMethods();
    const [cash, setCash] = useState("");
    const [propina, setPropina] = useState("");
    const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);

    const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId) ?? null;
    const isCash = !selectedMethod || selectedMethod.name.toLowerCase().includes("efectivo");
    const cashNum = parseFloat(cash) || 0;
    const change = cashNum - total;

    return {
        paymentMethods,
        cash,
        setCash,
        cashNum,
        change,
        propina,
        setPropina,
        paymentMethodId,
        setPaymentMethodId,
        isCash,
    };
};
