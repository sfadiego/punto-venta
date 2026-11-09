import { LayoutGrid } from "lucide-react";
import { CatalogIcon } from "@/components/ui/CatalogIcon";
import { useQuickSaleContext } from "../../QuickSaleContext";
import { CategoryRailItem } from "./CategoryRailItem";

export const CategoryRail = () => {
    const { categories, activeCategoryId, setActiveCategoryId } = useQuickSaleContext();

    return (
        <nav
            className="w-28 shrink-0 flex flex-col gap-1 overflow-y-auto p-2 bg-white border-r border-stone-200"
            aria-label="Categorías"
        >
            <CategoryRailItem
                label="TODOS"
                icon={<LayoutGrid size={20} />}
                isActive={activeCategoryId === null}
                onSelect={() => setActiveCategoryId(null)}
            />
            {categories.map((category) => (
                <CategoryRailItem
                    key={category.id}
                    label={category.nombre}
                    icon={<CatalogIcon iconName={category.icon_name} iconSource={category.icon_source} size={20} />}
                    isActive={category.id === activeCategoryId}
                    onSelect={() => category.id && setActiveCategoryId(category.id)}
                />
            ))}
        </nav>
    );
};
