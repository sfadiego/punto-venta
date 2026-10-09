import { Select, SelectOption } from "@/components/ui/form/Select";
import { ICategory } from "@/models/ICategory";

interface SelectSlowMovingCategoryProps {
    categories: ICategory[];
    value: number | null;
    onChange: (categoryId: number | null) => void;
}

// Selector controlado de categoría — las opciones se resuelven aquí a partir de la lista.
export const SelectSlowMovingCategory = ({ categories, value, onChange }: SelectSlowMovingCategoryProps) => {
    const options: SelectOption[] = [
        { value: "", label: "Todas las categorías" },
        ...categories.map((category) => ({ value: String(category.id), label: category.nombre })),
    ];

    return (
        <Select<{ categoria_id: string }>
            name="categoria_id"
            options={options}
            value={value ? String(value) : ""}
            onChange={(selected) => onChange(selected ? Number(selected) : null)}
        />
    );
};
