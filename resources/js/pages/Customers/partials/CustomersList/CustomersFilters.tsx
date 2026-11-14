import { SearchInput } from "@/components/ui/form/SearchInput";
import { CustomersFilters as CustomersFiltersState } from "../../useCustomersFilters";
import { CustomerFilterCheckbox } from "./CustomerFilterCheckbox";

interface CustomersFiltersProps {
    filters: CustomersFiltersState;
    /** Apartados (solo retail): agrega las casillas "Con apartados" y "Apartados vencidos". */
    showLayaways: boolean;
}

export const CustomersFilters = ({ filters, showLayaways }: CustomersFiltersProps) => (
    <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput
            value={filters.search}
            onChange={filters.setSearch}
            placeholder="Buscar por nombre o teléfono..."
            className="flex-1 min-w-[200px]"
        />
        <CustomerFilterCheckbox label="Solo con adeudo" checked={filters.withDebt} onChange={filters.setWithDebt} />
        {showLayaways && (
            <>
                <CustomerFilterCheckbox label="Con apartados" checked={filters.withLayaway} onChange={filters.setWithLayaway} />
                <CustomerFilterCheckbox label="Apartados vencidos" checked={filters.layawayOverdue} onChange={filters.setLayawayOverdue} />
            </>
        )}
    </div>
);
