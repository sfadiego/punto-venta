import { useState } from "react";
import { useCustomerList } from "@/services/useCustomerService";

// Modo de venta a crédito: elegir cliente en vez de método de pago (ver usePaymentMethod.ts).
export const useCreditPayment = () => {
    const { data: customers = [] } = useCustomerList();
    const [isCreditMode, setIsCreditMode] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;

    return {
        customers,
        isCreditMode,
        setIsCreditMode,
        selectedCustomerId,
        setSelectedCustomerId,
        selectedCustomer,
    };
};
