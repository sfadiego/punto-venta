import { SearchInput } from "@/components/ui/form/SearchInput";
import { ICategory } from "@/models/ICategory";
import { SelectSlowMovingDays } from "./SelectSlowMovingDays";
import { SelectSlowMovingCategory } from "./SelectSlowMovingCategory";

interface SlowMovingFiltersProps {
    days: number;
    onDaysChange: (days: number) => void;
    search: string;
    onSearchChange: (value: string) => void;
    categories: ICategory[];
    categoryId: number | null;
    onCategoryChange: (categoryId: number | null) => void;
}

export const SlowMovingFilters = ({
    days, onDaysChange, search, onSearchChange, categories, categoryId, onCategoryChange,
}: SlowMovingFiltersProps) => (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder="Buscar por nombre o código..."
            className="flex-1 min-w-[200px]"
        />
        <div className="lg:w-64">
            <SelectSlowMovingDays value={days} onChange={onDaysChange} />
        </div>
        <div className="lg:w-56">
            <SelectSlowMovingCategory categories={categories} value={categoryId} onChange={onCategoryChange} />
        </div>
    </div>
);
