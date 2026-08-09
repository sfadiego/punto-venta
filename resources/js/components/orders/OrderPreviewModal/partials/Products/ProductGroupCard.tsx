import { Loader, CheckCircle2, Circle, ChevronDown, ChevronRight, MessageSquare } from "lucide-react";
import { IProductGroup } from "@/models/IProductGroup";
import { formatCantidad, formatUnitsLabel, formatGroupSummary } from "@/utils/formatUnits";
import { ProductLineItem } from "./ProductLineItem";

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
    const singleUnitsLabel = !hasMany ? (formatUnitsLabel(group.items[0]) ?? formatCantidad(group.items[0])) : null;
    return (
        <div className="rounded-xl border overflow-hidden">
            <div
                className={`flex gap-3 p-3 items-center transition-colors ${
                    group.allReady ? "bg-emerald-50 border-emerald-200" : "bg-stone-50 border-stone-100"
                }`}
            >
                {hasMany && (
                    <button
                        onClick={onToggleExpand}
                        className="shrink-0 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                )}
                <div className="flex-1 min-w-0">
                    <p
                        className={`text-sm font-semibold ${group.allReady ? "text-emerald-700 line-through decoration-emerald-400/60" : "text-stone-900"}`}
                    >
                        {group.name}
                    </p>
                    {hasMany && (
                        <p className="text-xs text-stone-400 mt-0.5">
                            {formatGroupSummary(group)}
                        </p>
                    )}
                    {!hasMany && (
                        <p className="text-xs text-stone-400 mt-0.5">{singleUnitsLabel}</p>
                    )}
                    {!hasMany && group.items[0].observacion && (
                        <div className="flex items-start gap-1 mt-1">
                            <MessageSquare size={11} className="text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-2 py-0.5">
                                {group.items[0].observacion}
                            </p>
                        </div>
                    )}
                </div>
                <button
                    onClick={onToggleGroupReady}
                    disabled={groupIsPending}
                    title={group.allReady ? "Marcar grupo como pendiente" : "Marcar grupo como listo"}
                    className="shrink-0 self-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {groupIsPending ? (
                        <Loader size={20} className="animate-spin text-stone-400" />
                    ) : group.allReady ? (
                        <CheckCircle2 size={20} className="text-emerald-500" />
                    ) : group.readyCount > 0 ? (
                        <CheckCircle2 size={20} className="text-emerald-300" />
                    ) : (
                        <Circle size={20} className="text-stone-300 hover:text-emerald-400" />
                    )}
                </button>
            </div>

            {hasMany &&
                isExpanded &&
                group.items.map((item, idx) => (
                    <ProductLineItem
                        key={item.id ?? idx}
                        item={item}
                        groupName={group.name}
                        isPending={item.id !== undefined && pendingProductIds.has(item.id)}
                        onToggleReady={() => item.id !== undefined && onToggleProductReady(item.id)}
                    />
                ))}
        </div>
    );
};
