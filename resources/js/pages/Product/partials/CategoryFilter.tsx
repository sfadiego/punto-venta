import { ICategory } from "@/models/ICategory";
import { CategoryFilterChip } from "./CategoryFilterChip";

interface CategoryFilterProps {
    categories: ICategory[];
    selected: number | null;
    onChange: (id: number | null) => void;
    loading?: boolean;
}

export const CategoryFilter = ({ categories, selected, onChange, loading = false }: CategoryFilterProps) => (
    <div className="flex flex-wrap gap-2">
        <CategoryFilterChip active={selected === null} loading={loading && selected === null} onClick={() => onChange(null)}>
            TODOS
        </CategoryFilterChip>
        {categories.map((cat) => (
            <CategoryFilterChip
                key={cat.id}
                active={selected === cat.id}
                loading={loading && selected === cat.id}
                onClick={() => onChange(cat.id!)}
            >
                {cat.nombre}
            </CategoryFilterChip>
        ))}
    </div>
);
