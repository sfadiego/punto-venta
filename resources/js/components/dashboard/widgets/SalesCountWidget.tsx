import { ShoppingCart } from "lucide-react";
import { Widget } from "./Widget";
import { useAverageTicket } from "@/services/useStatisticsService";

interface ISalesCountWidgetProps {
    /** Mes a consultar (YYYY-MM). Sin `sistemaId` ni `date` cuenta todas las ventas. */
    date?: string;
    /** Caja a consultar: cuenta solo las ventas de esa sesión. */
    sistemaId?: number | null;
    branchId?: number | null;
    /** Texto del periodo, ej. "esta sesión" o "este mes". */
    periodLabel: string;
}

export const SalesCountWidget = ({ date, sistemaId, branchId, periodLabel }: ISalesCountWidgetProps) => {
    const { data } = useAverageTicket(date, sistemaId, branchId);
    const count = data?.orders_count ?? 0;

    return (
        <Widget
            title="Ventas realizadas"
            value={String(count)}
            trend={`${count === 1 ? "venta" : "ventas"} ${periodLabel}`}
            up={count > 0}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            wicon={ShoppingCart}
        />
    );
};
