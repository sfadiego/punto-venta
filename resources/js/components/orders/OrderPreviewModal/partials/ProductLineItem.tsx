import { Loader, CheckCircle2, Circle, MessageSquare } from "lucide-react";
import { IOrderProduct } from "@/models/IOrderProduct";
import { formatCantidad } from "@/utils/formatUnits";

interface ProductLineItemProps {
    item: IOrderProduct;
    groupName: string;
    isPending: boolean;
    onToggleReady: () => void;
}

export const ProductLineItem = ({ item, groupName, isPending, onToggleReady }: ProductLineItemProps) => (
    <div
        className={`flex gap-3 px-3 py-2 items-center border-t transition-colors ${
            item.is_ready ? "bg-emerald-50/60" : "bg-white"
        }`}
    >
        <div className="w-4 shrink-0" />
        <div
            className={`min-w-[2rem] h-6 px-1.5 rounded flex items-center justify-center shrink-0 text-xs font-bold whitespace-nowrap ${
                item.is_ready ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
            }`}
        >
            {formatCantidad(item)}
        </div>
        <div className="flex-1 min-w-0">
            <p
                className={`text-xs font-medium ${item.is_ready ? "text-emerald-600 line-through decoration-emerald-400/60" : "text-stone-700"}`}
            >
                {groupName}
            </p>
            {item.observacion && (
                <div className="flex items-start gap-1 mt-0.5">
                    <MessageSquare size={10} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 bg-amber-50 rounded px-1.5 py-0.5">
                        {item.observacion}
                    </p>
                </div>
            )}
        </div>
        <button
            onClick={onToggleReady}
            disabled={isPending}
            title={item.is_ready ? "Marcar como pendiente" : "Marcar como listo"}
            className="shrink-0 self-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isPending ? (
                <Loader size={16} className="animate-spin text-stone-400" />
            ) : item.is_ready ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
            ) : (
                <Circle size={16} className="text-stone-300 hover:text-emerald-400" />
            )}
        </button>
    </div>
);
