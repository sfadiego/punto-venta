import { IProductCategoryGroup, getCategorySelectionState } from "@/utils/addonUtils";

interface AddonProductCategoryGroupProps {
    group: IProductCategoryGroup;
    selectedIds: Set<number>;
    onToggleCategory: (productIds: number[]) => void;
    onToggleProduct: (productId: number) => void;
}

export const AddonProductCategoryGroup = ({
    group,
    selectedIds,
    onToggleCategory,
    onToggleProduct,
}: AddonProductCategoryGroupProps) => {
    const { selectedCount, checked, indeterminate } = getCategorySelectionState(group.products, selectedIds);

    return (
        // shrink-0: dentro del contenedor flex con scroll, sin esto la categoría se encoge y recorta sus productos.
        <div className="shrink-0 border border-stone-200 rounded-xl overflow-hidden">
            <label className="flex items-center gap-2.5 px-3 py-2 bg-stone-50 border-b border-stone-200 cursor-pointer">
                <input
                    type="checkbox"
                    checked={checked}
                    ref={(element) => {
                        if (element) element.indeterminate = indeterminate;
                    }}
                    onChange={() => onToggleCategory(group.products.map((product) => product.id))}
                    className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-400"
                />
                <span className="flex-1 min-w-0 text-sm font-semibold text-stone-800 truncate">{group.categoryName}</span>
                <span className="font-mono text-xs text-stone-500">
                    {selectedCount}/{group.products.length}
                </span>
            </label>
            <div className="p-1">
                {group.products.map((product) => (
                    <label
                        key={product.id}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm text-stone-700 cursor-pointer hover:bg-stone-50"
                    >
                        <input
                            type="checkbox"
                            checked={selectedIds.has(product.id)}
                            onChange={() => onToggleProduct(product.id)}
                            className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-400"
                        />
                        <span className="min-w-0 break-words">{product.nombre}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};
