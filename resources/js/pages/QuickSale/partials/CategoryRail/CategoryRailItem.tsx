import { CatalogIcon } from "@/components/ui/CatalogIcon";
import { ICategory } from "@/models/ICategory";

interface CategoryRailItemProps {
    category: ICategory;
    isActive: boolean;
    onSelect: (id: number) => void;
}

export const CategoryRailItem = ({ category, isActive, onSelect }: CategoryRailItemProps) => (
    <button
        type="button"
        onClick={() => category.id && onSelect(category.id)}
        className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-center transition-colors ${
            isActive ? "text-white shadow-sm" : "text-stone-500 hover:bg-stone-100 hover:text-stone-700"
        }`}
        style={isActive ? { backgroundColor: "var(--color-primary)" } : undefined}
    >
        <CatalogIcon iconName={category.icon_name} iconSource={category.icon_source} size={20} />
        <span className="text-[11px] font-semibold leading-tight">{category.nombre}</span>
    </button>
);
