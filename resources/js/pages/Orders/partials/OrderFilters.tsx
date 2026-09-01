import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { X } from "lucide-react";
import { getActiveStatuses } from "@/utils/orderStatus";

const BASE_STATUS_OPTIONS = [
    { value: String(OrderStatusEnum.InProcess),    label: "En proceso",        dot: "bg-amber-400",   orderServedOnly: false, hideWhenNoServed: true },
    { value: String(OrderStatusEnum.Served), label: "Orden servida", dot: "bg-blue-400",    orderServedOnly: true,  hideWhenNoServed: false },
    { value: String(OrderStatusEnum.Closed),       label: "Cerrado",           dot: "bg-emerald-400", orderServedOnly: false, hideWhenNoServed: false },
];

interface OrderFiltersProps {
    estatusId: string;
    showOrderServed?: boolean;
    onEstatusChange: (value: string) => void;
    onClear: () => void;
}

export const OrderFilters = ({
    estatusId,
    showOrderServed = true,
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
    ];
    const hasActiveFilters = estatusId !== activeStatuses;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {statusOptions.map((opt) => {
                const active = estatusId === opt.value;
                return (
                    <button
                        key={opt.value}
                        onClick={() => onEstatusChange(opt.value)}
                        className={`h-10 flex items-center gap-2 px-3.5 rounded-xl border text-sm
                            font-medium transition-all whitespace-nowrap
                            ${active
                                ? "border-amber-400 bg-amber-50 text-amber-700 shadow-sm"
                                : "border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300 hover:bg-white"
                            }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                        {opt.label}
                    </button>
                );
            })}
            {hasActiveFilters && (
                <button
                    onClick={onClear}
                    className="h-10 flex items-center gap-1.5 px-3 rounded-xl border
                        border-stone-200 bg-stone-50 text-xs font-medium text-stone-400
                        hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all whitespace-nowrap"
                >
                    <X size={13} />
                    Limpiar
                </button>
            )}
        </div>
    );
};
