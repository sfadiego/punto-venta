import { OrderStatusEnum } from "@/enums/OrderStatusEnum";

const STATUS_STYLES: Record<number, string> = {
    [OrderStatusEnum.InProcess]: "bg-amber-100 text-amber-700",
    [OrderStatusEnum.Closed]:    "bg-emerald-100 text-emerald-700",
    [OrderStatusEnum.Canceled]:  "bg-red-100 text-red-600",
    [OrderStatusEnum.Served]:    "bg-blue-100 text-blue-700",
    [OrderStatusEnum.Deleted]:   "bg-stone-100 text-stone-400",
    [OrderStatusEnum.Layaway]:   "bg-purple-100 text-purple-700",
};

const STATUS_LABELS: Record<number, string> = {
    [OrderStatusEnum.InProcess]: "En proceso",
    [OrderStatusEnum.Closed]:    "Cerrado",
    [OrderStatusEnum.Canceled]:  "Cancelado",
    [OrderStatusEnum.Served]:    "Orden servida",
    [OrderStatusEnum.Deleted]:   "Eliminado",
    [OrderStatusEnum.Layaway]:   "Apartado",
};

export const getStatusStyle = (statusId: number): string =>
    STATUS_STYLES[statusId] ?? "bg-stone-100 text-stone-600";

export const getStatusLabel = (statusId: number): string =>
    STATUS_LABELS[statusId] ?? "—";

// Valor de filtro "Activos" del listado de órdenes: incluye Servida solo si el negocio usa
// order_served (Restaurante) — ver OrderFilters.tsx / useOrderList.tsx.
export const getActiveStatuses = (showOrderServed: boolean): string =>
    showOrderServed
        ? `${OrderStatusEnum.InProcess},${OrderStatusEnum.Served}`
        : String(OrderStatusEnum.InProcess);

// Estado de un apartado visto desde el historial del cliente: "Apartado" es activo, "Cerrado"
// significa que se liquidó y "Cancelado" que se canceló y reembolsó.
const LAYAWAY_STATUS_LABELS: Record<number, string> = {
    [OrderStatusEnum.Layaway]:  "Activo",
    [OrderStatusEnum.Closed]:   "Liquidado",
    [OrderStatusEnum.Canceled]: "Cancelado",
};

export const getLayawayStatusLabel = (statusId: number): string =>
    LAYAWAY_STATUS_LABELS[statusId] ?? getStatusLabel(statusId);

export const getLayawayStatusStyle = (statusId: number): string =>
    statusId === OrderStatusEnum.Layaway ? "bg-amber-100 text-amber-700" : getStatusStyle(statusId);
