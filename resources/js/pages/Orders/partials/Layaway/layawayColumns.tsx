import { DataTableColumn } from "mantine-datatable";
import { IOrder } from "@/models/IOrder";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { LayawayProgress } from "@/components/orders/Layaway/Detail/LayawayProgress";
import { LayawayDueBadge } from "@/components/orders/Layaway/Detail/LayawayDueBadge";
import { LayawayRowActions } from "./LayawayRowActions";

// Columnas propias del tab "Apartados": el listado paginado del backend trae las columnas
// genéricas de órdenes (nombre, pago, subtotal...), que no aplican a un apartado.
export const layawayColumns: DataTableColumn<IOrder>[] = [
    {
        accessor: "id",
        title: "#",
        // Ancho para ids largos (ej. #60025743): con menos, el número invade la columna del cliente.
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
        accessor: "total",
        title: "Total",
        render: (order) => <span className="tabular-nums">{formatCurrencyTrimmed(order.total)}</span>,
    },
    {
        accessor: "amount_paid",
        title: "Abonado",
        width: 190,
        render: (order) => <LayawayProgress total={order.total} paid={order.amount_paid} />,
    },
    {
        accessor: "layaway_due_date",
        title: "Vence",
        render: (order) => <LayawayDueBadge dueDate={order.layaway_due_date} />,
    },
    {
        accessor: "_acciones" as keyof IOrder,
        title: "",
        width: 200,
        textAlign: "right",
        render: (order) => <LayawayRowActions order={order} />,
    },
];
