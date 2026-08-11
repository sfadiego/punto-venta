import { ICategory } from "@/models/ICategory";
import { CategoryFilterChip } from "./CategoryFilterChip";

interface CategoryFilterProps {
    categories: ICategory[];
    selected: number | null;
    onChange: (id: number | null) => void;
}

export const CategoryFilter = ({ categories, selected, onChange }: CategoryFilterProps) => (
    <div className="flex flex-wrap gap-2">
        <CategoryFilterChip active={selected === null} onClick={() => onChange(null)}>
            TODOS
        </CategoryFilterChip>
        {categories.map((cat) => (
            <CategoryFilterChip
                key={cat.id}
                active={selected === cat.id}
                onClick={() => onChange(cat.id!)}
            >
                {cat.nombre}
            </CategoryFilterChip>
        ))}
    </div>
);
