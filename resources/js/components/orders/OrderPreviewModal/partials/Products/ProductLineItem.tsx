import { IOrderProduct } from "@/models/IOrderProduct";
import { formatCantidadBadge } from "@/utils/formatUnits";
import { ObservationTag } from "./ObservationTag";
import { ReadyToggleButton } from "./ReadyToggleButton";

interface ProductLineItemProps {
    item: IOrderProduct;
    isPending: boolean;
    onToggleReady: () => void;
}

export const ProductLineItem = ({ item, isPending, onToggleReady }: ProductLineItemProps) => (
    <div className={`flex gap-2.5 pl-10 pr-4 py-1.5 items-center border-t border-dashed border-stone-200 transition-colors ${item.is_ready ? "bg-emerald-50/40" : "bg-stone-50"}`}>
        <span className={`shrink-0 min-w-[26px] text-xs font-mono tabular-nums ${item.is_ready ? "text-stone-400" : "text-amber-800"}`}>
            {formatCantidadBadge(item)}
        </span>
        <div className="flex-1 min-w-0">
            {item.observacion ? (
                <ObservationTag text={item.observacion} />
            ) : (
                <span className="text-xs text-stone-400">Sin observación</span>
            )}
        </div>
        <ReadyToggleButton
            isReady={!!item.is_ready}
            isPending={isPending}
            title={item.is_ready ? "Marcar como pendiente" : "Marcar como listo"}
            onClick={onToggleReady}
        />
    </div>
);
