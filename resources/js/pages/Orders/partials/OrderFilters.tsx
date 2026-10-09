import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { X } from "lucide-react";
import { getActiveStatuses } from "@/utils/orderStatus";

const BASE_STATUS_OPTIONS = [
    { value: String(OrderStatusEnum.InProcess), label: "En proceso", dot: "bg-amber-400", orderServedOnly: false, hideWhenNoServed: true },
    { value: String(OrderStatusEnum.Served), label: "Orden servida", dot: "bg-blue-400", orderServedOnly: true, hideWhenNoServed: false },
    { value: String(OrderStatusEnum.Closed), label: "Cerrado", dot: "bg-emerald-400", orderServedOnly: false, hideWhenNoServed: false },
];

// Filtros propios de retail con apartados: los apartados activos y los cancelados (con su retención).
const LAYAWAY_STATUS_OPTIONS = [
    { value: String(OrderStatusEnum.Layaway), label: "Apartados", dot: "bg-purple-400" },
    { value: String(OrderStatusEnum.Canceled), label: "Cancelados", dot: "bg-red-400" },
];

interface OrderFiltersProps {
    estatusId: string;
    showOrderServed?: boolean;
    /** Apartados (solo retail con permiso `layaway`): agrega los filtros "Apartados" y "Cancelados". */
    showLayaways?: boolean;
    onEstatusChange: (value: string) => void;
    onClear: () => void;
}

// Filtros de estatus como control segmentado: una sola barra, la opción activa resaltada, y en
// pantallas angostas la barra se desplaza en horizontal en vez de partirse en varias filas.
export const OrderFilters = ({
    estatusId,
    showOrderServed = true,
    showLayaways = false,
    onEstatusChange,
    onClear,
}: OrderFiltersProps) => {
    const activeStatuses = getActiveStatuses(showOrderServed);
    const statusOptions = [
        { value: activeStatuses, label: "Activos", dot: "bg-stone-400" },
        ...BASE_STATUS_OPTIONS.filter((o) =>
            (!o.orderServedOnly || showOrderServed) &&
            (!o.hideWhenNoServed || showOrderServed)
        ),
        ...(showLayaways ? LAYAWAY_STATUS_OPTIONS : []),
    ];
    const hasActiveFilters = estatusId !== activeStatuses;

    return (
        <div className="flex items-center gap-2 min-w-0">
            <div
                role="tablist"
                aria-label="Filtrar por estatus"
                className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 overflow-x-auto max-w-full"
            >
                {statusOptions.map((opt) => {
                    const active = estatusId === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => onEstatusChange(opt.value)}
                            className={`h-9 flex items-center gap-2 px-3.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0
                                ${active
                                    ? "bg-white text-amber-700 shadow-sm"
                                    : "text-stone-500 hover:text-stone-700 hover:bg-white/60"
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                            {opt.label}
                        </button>
                    );
                })}
            </div>
            {hasActiveFilters && (
                <button
                    type="button"
                    onClick={onClear}
                    title="Limpiar filtros"
                    className="h-9 shrink-0 flex items-center gap-1.5 px-3 rounded-xl text-xs font-medium text-stone-400
                        hover:bg-red-50 hover:text-red-500 transition-all whitespace-nowrap"
                >
                    <X size={13} />
                    Limpiar
                </button>
            )}
        </div>
    );
};
