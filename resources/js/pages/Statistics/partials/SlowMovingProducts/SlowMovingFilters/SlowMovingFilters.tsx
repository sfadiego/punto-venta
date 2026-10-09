import { Search } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
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
        <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 z-10 pointer-events-none" />
            <Input
                name="search"
                inputType="search"
                placeholder="Buscar por nombre o código..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
            />
        </div>
        <div className="lg:w-64">
            <SelectSlowMovingDays value={days} onChange={onDaysChange} />
        </div>
        <div className="lg:w-56">
            <SelectSlowMovingCategory categories={categories} value={categoryId} onChange={onCategoryChange} />
        </div>
    </div>
);
