import { DebtSummaryCards } from "@/components/customers/DebtSummaryCards";
import { useCustomersPage } from "./useCustomersPage";
import { CustomersHeader } from "./partials/CustomersList/CustomersHeader";
import { CustomersFilters } from "./partials/CustomersList/CustomersFilters";
import { CustomersTable } from "./partials/CustomersList/CustomersTable/CustomersTable";
import { AddCustomerModal } from "./partials/CustomerModals/AddCustomerModal";
import { EditCustomerModal } from "./partials/CustomerModals/EditCustomerModal";

export default function CustomersPage() {
    const { filters, list, modals, debtSummary, showLayaways } = useCustomersPage();

    return (
        <div className="px-5 py-6 max-w-6xl mx-auto">
            <CustomersHeader total={list.total} onRefresh={list.refetch} onAdd={modals.add.open} />

            <div className="mb-6">
                <DebtSummaryCards summary={debtSummary} surface="card" />
            </div>

            <CustomersFilters filters={filters} showLayaways={showLayaways} />

            <CustomersTable
                tableProps={list.tableProps}
                showLayaways={showLayaways}
                onEdit={modals.edit.start}
            />

            <AddCustomerModal isOpen={modals.add.isOpen} formik={modals.add.formik} onClose={modals.add.close} />

            <EditCustomerModal
                isOpen={modals.edit.customer !== null}
                customer={modals.edit.customer}
                formik={modals.edit.formik}
                onClose={modals.edit.close}
            />
        </div>
    );
}
