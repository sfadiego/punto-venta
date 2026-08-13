import { useState } from "react";
import { NavigateFunction } from "react-router-dom";
import { AdminRoutes } from "@/enums/RoutesEnum";

interface UsePrintOrderParams {
    resumeOrderId: number | null;
    createOrderFromCart: () => Promise<number>;
    navigate: NavigateFunction;
}

// Imprimir sin haber guardado aún: crea la orden como InProcess (igual que "Guardar y
// continuar después") para tener un id que imprimir, y pasa la página a modo retomar esa
// orden — desde ahí en adelante el carrito sincroniza acción por acción como cualquier venta
// retomada.
export const usePrintOrder = ({ resumeOrderId, createOrderFromCart, navigate }: UsePrintOrderParams) => {
    const [isPreparingPrint, setIsPreparingPrint] = useState(false);

    const ensureOrderForPrint = async (): Promise<number> => {
        if (resumeOrderId) return resumeOrderId;
        setIsPreparingPrint(true);
        try {
            const newOrderId = await createOrderFromCart();
            navigate(`${AdminRoutes.QuickSale}/${newOrderId}`, { replace: true });
            return newOrderId;
        } finally {
            setIsPreparingPrint(false);
        }
    };

    return { ensureOrderForPrint, isPreparingPrint };
};
