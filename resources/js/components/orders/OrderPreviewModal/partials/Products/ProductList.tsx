import { Loader } from "lucide-react";
import { IProductGroup } from "@/models/IProductGroup";
import { ProductGroupCard } from "./ProductGroupCard";

interface ProductListProps {
    isLoading: boolean;
    productGroups: IProductGroup[];
    expandedGroups: Set<string>;
    pendingProductIds: Set<number>;
    onToggleGroupExpand: (groupKey: string) => void;
    onToggleGroupReady: (groupKey: string) => void;
    onToggleProductReady: (orderProductId: number) => void;
}

export const ProductList = ({
    isLoading,
    productGroups,
    expandedGroups,
    pendingProductIds,
    onToggleGroupExpand,
    onToggleGroupReady,
    onToggleProductReady,
}: ProductListProps) => (
    <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
        {isLoading ? (
            <div className="flex justify-center py-8">
                <Loader size={20} className="animate-spin text-stone-400" />
            </div>
        ) : productGroups.length === 0 ? (
            <p className="text-sm text-stone-400 italic text-center py-8">Sin productos en esta orden</p>
        ) : (
            productGroups.map((group) => {
                const groupIsPending = group.items.some(
                    (i) => i.id !== undefined && pendingProductIds.has(i.id),
                );

                return (
                    <ProductGroupCard
                        key={group.key}
                        group={group}
                        isExpanded={expandedGroups.has(group.key)}
                        groupIsPending={groupIsPending}
                        pendingProductIds={pendingProductIds}
                        onToggleExpand={() => onToggleGroupExpand(group.key)}
                        onToggleGroupReady={() => onToggleGroupReady(group.key)}
                        onToggleProductReady={onToggleProductReady}
                    />
                );
            })
        )}
    </div>
);
