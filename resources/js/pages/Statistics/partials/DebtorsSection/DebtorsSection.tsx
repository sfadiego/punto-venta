import { DataTable } from "mantine-datatable";
import { ChevronRight, HandCoins } from "lucide-react";
import { ITopDebtor } from "@/models/ITopDebtors";
import { DebtSummaryCards } from "@/components/customers/DebtSummaryCards";
import { DebtorsExportButton } from "./DebtorsExportButton";
import { useDebtorsSection } from "./useDebtorsSection";

// Clientes con más adeudo (retail y venta por peso): a quién cobrar primero. Complementa el widget
// "Top 5" de venta por peso, que se conserva tal cual.
export const DebtorsSection = () => {
    const { summary, rows, columns, isLoading, goToCustomer, goToAllDebtors } = useDebtorsSection();

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <HandCoins size={20} className="text-red-500" />
                        <h2 className="text-sm font-semibold text-stone-800">Clientes con adeudo</h2>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">
                        Los 10 clientes que más deben y cuánto llevan sin abonar. Un apartado no cuenta como adeudo.
                    </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <DebtorsExportButton />
                    <button
                        type="button"
                        onClick={goToAllDebtors}
                        className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors whitespace-nowrap"
                    >
                        Ver todos
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            <DebtSummaryCards summary={summary} />

            <DataTable<ITopDebtor>
                columns={columns}
                records={rows}
                fetching={isLoading}
                onRowClick={({ record }) => goToCustomer(record.id)}
                noRecordsText="Ningún cliente tiene adeudo"
                highlightOnHover
                withTableBorder
                withColumnBorders
                striped
                minHeight={160}
                classNames={{ header: "pos-datatable-header" }}
            />
        </div>
    );
};
