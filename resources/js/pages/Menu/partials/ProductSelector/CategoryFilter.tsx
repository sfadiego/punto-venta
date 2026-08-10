import { IMenuCategory } from "@/models/IMenu";
import { CategoryPill } from "./CategoryPill";

interface CategoryFilterProps {
    categories: IMenuCategory[];
    activeId: number | null;
    onSelect: (id: number | null) => void;
    primaryColor: string;
}

export const CategoryFilter = ({ categories, activeId, onSelect, primaryColor }: CategoryFilterProps) => (
    <div className="shrink-0 bg-white border-b border-stone-100">
        <div className="max-w-3xl mx-auto px-4">
            <div
                className="flex gap-2 overflow-x-auto py-3"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
            >
                <CategoryPill
                    label="Todos"
                    active={activeId === null}
                    onClick={() => onSelect(null)}
                    primaryColor={primaryColor}
                />
                {categories.map((c) => (
                    <CategoryPill
                        key={c.id}
                        label={c.nombre}
                        icon={c.icon}
                        active={activeId === c.id}
                        onClick={() => onSelect(activeId === c.id ? null : c.id)}
                        primaryColor={primaryColor}
                    />
                ))}
            </div>
        </div>
    </div>
);
