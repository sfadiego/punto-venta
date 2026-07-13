import { useState } from "react";
import { ClipboardCheck, ChevronDown, ChevronUp } from "lucide-react";
import { usePendingOrders } from "./usePendingOrders";
import { PendingOrderCard } from "./PendingOrderCard";

export const PendingOrdersSection = () => {
    const { orders, isLoading, pendingIds, handleAccept, handleReject } = usePendingOrders();
    const [expanded, setExpanded] = useState(false);

    if (isLoading || orders.length === 0) return null;

    return (
        <div className="mb-2 bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-100/60 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <ClipboardCheck size={15} className="text-amber-600 shrink-0" />
                    <span className="text-sm font-semibold text-amber-800">
                        Solicitudes pendientes
                    </span>
                    <span className="bg-amber-400 text-white text-xs font-bold px-2 py-0.5 rounded-full tabular-nums">
                        {orders.length}
                    </span>
                </div>
                {expanded
                    ? <ChevronUp size={16} className="text-amber-500 shrink-0" />
                    : <ChevronDown size={16} className="text-amber-500 shrink-0" />
                }
            </button>

            {expanded && (
                <div className="px-4 pb-4 flex flex-col gap-3">
                    <div className="h-px bg-amber-200" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
                        {orders.map((order) => (
                            <PendingOrderCard
                                key={order.id}
                                order={order}
                                isPending={pendingIds.has(order.id)}
                                onAccept={handleAccept}
                                onReject={handleReject}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
