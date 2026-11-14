import { SearchInput } from "@/components/ui/form/SearchInput";
import { SelectEmployeeActiveFilter } from "./SelectEmployeeActiveFilter";

interface EmployeesFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    active: string;
    onActiveChange: (value: string) => void;
}

export const EmployeesFilters = ({ search, onSearchChange, active, onActiveChange }: EmployeesFiltersProps) => (
    <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder="Buscar por nombre o teléfono..."
            className="flex-1 min-w-[200px]"
        />
        <div className="w-full sm:w-48">
            <SelectEmployeeActiveFilter value={active} onChange={onActiveChange} />
        </div>
    </div>
);
