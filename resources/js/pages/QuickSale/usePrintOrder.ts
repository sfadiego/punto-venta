import { useState } from "react";
import { NavigateFunction } from "react-router-dom";
import { AdminRoutes } from "@/enums/RoutesEnum";

interface UsePrintOrderParams {
    resumeOrderId: number | null;
    persistCart: () => Promise<number>;
    navigate: NavigateFunction;
}

// Imprimir: deja la orden guardada con el carrito actual (persistCart) para que el ticket salga
// completo. Si la venta era nueva, la orden se crea como InProcess (igual que "Guardar y
// continuar después") y la página pasa a modo retomar esa orden.
export const usePrintOrder = ({ resumeOrderId, persistCart, navigate }: UsePrintOrderParams) => {
    const [isPreparingPrint, setIsPreparingPrint] = useState(false);

    const ensureOrderForPrint = async (): Promise<number> => {
        setIsPreparingPrint(true);
        try {
            const orderId = await persistCart();
            if (!resumeOrderId) navigate(`${AdminRoutes.QuickSale}/${orderId}`, { replace: true });
            return orderId;
        } finally {
            setIsPreparingPrint(false);
        }
    };

    return { ensureOrderForPrint, isPreparingPrint };
};
