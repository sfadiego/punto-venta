import { DataTableColumn } from "mantine-datatable";
import { IOrder } from "@/models/IOrder";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { formatOrderDateTime } from "@/utils/dateUtils";
import { LayawayRowActions } from "./LayawayRowActions";

const money = (value: number | string | null | undefined): number => Number(value ?? 0);

// Columnas del filtro "Cancelados": cada apartado cancelado con lo que abonó el cliente, lo que se le
// reembolsó y lo que el negocio retuvo. Los montos salen de las sumas del historial (layaways_only).
export const canceledLayawayColumns: DataTableColumn<IOrder>[] = [
    {
        accessor: "id",
        title: "#",
        width: 130,
        render: (order) => <span className="text-stone-400 tabular-nums whitespace-nowrap">#{order.id}</span>,
    },
    {
        accessor: "customer",
        title: "Cliente",
        render: (order) => (
            <div className="min-w-0">
                <p className="font-semibold text-stone-800 truncate">{order.customer?.name ?? "Sin cliente"}</p>
                <p className="text-xs text-stone-400 truncate">{order.nombre_pedido}</p>
            </div>
        ),
    },
    {
        accessor: "updated_at",
        title: "Cancelado",
        render: (order) => <span className="text-stone-600 whitespace-nowrap">{formatOrderDateTime(order.updated_at)}</span>,
    },
    {
        accessor: "layaway_deposited",
        title: "Abonado",
        textAlign: "right",
        render: (order) => <span className="tabular-nums">{formatCurrencyTrimmed(money(order.layaway_deposited))}</span>,
    },
    {
        accessor: "layaway_refunded",
        title: "Reembolsado",
        textAlign: "right",
        render: (order) => (
            <span className={`tabular-nums ${money(order.layaway_refunded) > 0 ? "text-red-500 font-medium" : "text-stone-400"}`}>
                {formatCurrencyTrimmed(money(order.layaway_refunded))}
            </span>
        ),
    },
    {
        accessor: "layaway_retained",
        title: "Retenido",
        textAlign: "right",
        render: (order) => (
            <span className={`tabular-nums ${money(order.layaway_retained) > 0 ? "text-amber-600 font-semibold" : "text-stone-400"}`}>
                {formatCurrencyTrimmed(money(order.layaway_retained))}
            </span>
        ),
    },
    {
        accessor: "_acciones" as keyof IOrder,
        title: "",
        width: 90,
        textAlign: "right",
        render: (order) => <LayawayRowActions order={order} />,
    },
];
