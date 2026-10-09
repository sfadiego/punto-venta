import { Search } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { CustomersFilters as CustomersFiltersState } from "../../useCustomersFilters";
import { CustomerFilterCheckbox } from "./CustomerFilterCheckbox";

interface CustomersFiltersProps {
    filters: CustomersFiltersState;
    /** Apartados (solo retail): agrega las casillas "Con apartados" y "Apartados vencidos". */
    showLayaways: boolean;
}

export const CustomersFilters = ({ filters, showLayaways }: CustomersFiltersProps) => (
    <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 z-10" />
            <Input
                name="search"
                inputType="search"
                value={filters.search}
                onChange={(e) => filters.setSearch(e.target.value)}
                placeholder="Buscar por nombre o teléfono..."
                className="pl-9"
            />
        </div>
        <CustomerFilterCheckbox label="Solo con adeudo" checked={filters.withDebt} onChange={filters.setWithDebt} />
        {showLayaways && (
            <>
                <CustomerFilterCheckbox label="Con apartados" checked={filters.withLayaway} onChange={filters.setWithLayaway} />
                <CustomerFilterCheckbox label="Apartados vencidos" checked={filters.layawayOverdue} onChange={filters.setLayawayOverdue} />
            </>
        )}
    </div>
);
