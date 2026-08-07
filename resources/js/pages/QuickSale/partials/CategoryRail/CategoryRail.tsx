import { useQuickSaleContext } from "../../QuickSaleContext";
import { CategoryRailItem } from "./CategoryRailItem";

export const CategoryRail = () => {
    const { categories, activeCategoryId, setActiveCategoryId } = useQuickSaleContext();

    return (
        <nav
            className="w-28 shrink-0 flex flex-col gap-1 overflow-y-auto p-2 bg-white border-r border-stone-200"
            aria-label="Categorías"
        >
            {categories.map((category) => (
                <CategoryRailItem
                    key={category.id}
                    category={category}
                    isActive={category.id === activeCategoryId}
                    onSelect={setActiveCategoryId}
                />
            ))}
        </nav>
    );
};
