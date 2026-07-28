import { ICategory } from "@/models/ICategory";
import { Select, SelectOption } from "@/components/ui/form/Select";

interface SalesCategoryFilterProps {
    categoriaId: number | null;
    categories: ICategory[];
    onChange: (id: number | null) => void;
}

export const SalesCategoryFilter = ({ categoriaId, categories, onChange }: SalesCategoryFilterProps) => {
    const categoryOptions: SelectOption[] = [
        { value: "", label: "Todas las categorías" },
        ...categories.map((cat) => ({
            value: String(cat.id ?? ""),
            label: cat.nombre,
        })),
    ];

    return (
        <div className="flex flex-col gap-1.5 w-52">
            <label className="text-xs font-medium text-stone-500">Categoría</label>
            <Select<{ categoria: string }>
                name="categoria"
                options={categoryOptions}
                value={categoriaId !== null ? String(categoriaId) : ""}
                onChange={(val) => onChange(val ? Number(val) : null)}
                selectStyle="default"
                className="!py-0 h-9 !text-sm"
            />
        </div>
    );
};
