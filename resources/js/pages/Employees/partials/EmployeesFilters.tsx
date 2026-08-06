import { Search } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { SelectEmployeeActiveFilter } from "./SelectEmployeeActiveFilter";

interface EmployeesFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    active: string;
    onActiveChange: (value: string) => void;
}

export const EmployeesFilters = ({ search, onSearchChange, active, onActiveChange }: EmployeesFiltersProps) => (
    <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 z-10" />
            <Input
                name="search"
                inputType="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por nombre o teléfono..."
                className="pl-9"
            />
        </div>
        <div className="w-full sm:w-48">
            <SelectEmployeeActiveFilter value={active} onChange={onActiveChange} />
        </div>
    </div>
);
