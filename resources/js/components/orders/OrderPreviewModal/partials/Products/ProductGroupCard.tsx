import { ChevronDown, ChevronRight } from "lucide-react";
import { IProductGroup } from "@/models/IProductGroup";
import { formatGroupQtyBadge, formatGroupSummary } from "@/utils/formatUnits";
import { ProductLineItem } from "./ProductLineItem";
import { ProductAddonsBadges } from "./ProductAddonsBadges";
import { ObservationTag } from "./ObservationTag";
import { ReadyToggleButton } from "./ReadyToggleButton";

interface ProductGroupCardProps {
    group: IProductGroup;
    isExpanded: boolean;
    groupIsPending: boolean;
    pendingProductIds: Set<number>;
    onToggleExpand: () => void;
    onToggleGroupReady: () => void;
    onToggleProductReady: (orderProductId: number) => void;
}

export const ProductGroupCard = ({
    group,
    isExpanded,
    groupIsPending,
    pendingProductIds,
    onToggleExpand,
    onToggleGroupReady,
    onToggleProductReady,
}: ProductGroupCardProps) => {
    const hasMany = group.totalCount > 1;
    const observation = !hasMany ? group.items[0].observacion : null;

    return (
        <div className="border-b border-dashed border-stone-200 last:border-b-0">
            <div className={`flex gap-2.5 px-4 py-2 items-center transition-colors ${group.allReady ? "bg-emerald-50/40" : ""}`}>
                {hasMany && (
                    <button
                        onClick={onToggleExpand}
                        aria-label={isExpanded ? "Contraer" : "Expandir"}
                        className="shrink-0 -mr-1 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                )}
                <span className={`shrink-0 min-w-[26px] text-xs font-mono font-semibold tabular-nums ${group.allReady ? "text-stone-400" : "text-amber-800"}`}>
                    {formatGroupQtyBadge(group)}
                </span>
                <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-medium leading-tight ${group.allReady ? "text-stone-400 line-through decoration-stone-300" : "text-stone-900"}`}>
                        {group.name}
                    </p>
                    <ProductAddonsBadges addons={group.addons} isReady={group.allReady} />
                    {hasMany && <p className="text-xs text-stone-400 mt-0.5">{formatGroupSummary(group)}</p>}
                    {observation && <ObservationTag text={observation} />}
                </div>
                <ReadyToggleButton
                    isReady={group.allReady}
                    isPartial={group.readyCount > 0}
                    isPending={groupIsPending}
                    title={group.allReady ? "Marcar grupo como pendiente" : "Marcar grupo como listo"}
                    onClick={onToggleGroupReady}
                />
            </div>

            {hasMany &&
                isExpanded &&
                group.items.map((item, idx) => (
                    <ProductLineItem
                        key={item.id ?? idx}
                        item={item}
                        isPending={item.id !== undefined && pendingProductIds.has(item.id)}
                        onToggleReady={() => item.id !== undefined && onToggleProductReady(item.id)}
                    />
                ))}
        </div>
    );
};
