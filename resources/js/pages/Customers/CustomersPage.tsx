import { useMemo } from "react";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { Plus, RefreshCw, Search } from "lucide-react";
import { ICustomer } from "@/models/ICustomer";
import { formatCurrency } from "@/utils/formatCurrency";
import { Input } from "@/components/ui/form/Input";
import { useCustomersPage } from "./useCustomersPage";
import { AddCustomerModal } from "./partials/CustomerModals/AddCustomerModal";
import { useAddCustomerModal } from "./partials/CustomerModals/useAddCustomerModal";
import { EditCustomerModal } from "./partials/CustomerModals/EditCustomerModal";
import { useEditCustomerModal } from "./partials/CustomerModals/useEditCustomerModal";
import { CustomerTableActions } from "./partials/CustomerTableActions";

export default function CustomersPage() {
    const {
        customers,
        total,
        page,
        limit,
        pageSize,
        isLoading,
        refetch,
        setPage,
        setLimit,
        search,
        setSearch,
        withDebt,
        setWithDebt,
        editingCustomer,
        setEditingCustomer,
        invalidateCustomers,
    } = useCustomersPage();

    const { isOpen: addOpen, openModal: openAdd, handleClose: closeAdd, formik: addFormik } =
        useAddCustomerModal(invalidateCustomers);

    const { formik: editFormik } = useEditCustomerModal(
        editingCustomer,
        invalidateCustomers,
        () => setEditingCustomer(null),
    );

    const columns = useMemo<DataTableColumn<ICustomer>[]>(
        () => [
            {
                accessor: "name",
                title: "Nombre",
                render: (customer: ICustomer) => (
                    <div>
                        <span className="font-medium text-stone-900 text-sm">{customer.name}</span>
                        {customer.phone && (
                            <p className="text-xs text-stone-400 mt-0.5">{customer.phone}</p>
                        )}
                    </div>
                ),
            },
            {
                accessor: "balance",
                title: "Adeudo",
                width: 130,
                render: (customer: ICustomer) => (
                    <span
                        className={`text-sm font-semibold tabular-nums ${Number(customer.balance) > 0 ? "text-red-600" : "text-stone-400"
                            }`}
                    >
                        {formatCurrency(Number(customer.balance))}
                    </span>
                ),
            },
            {
                accessor: "allow_credit",
                title: "Crédito",
                width: 110,
                render: (customer: ICustomer) => (
                    <span
                        className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${customer.allow_credit ? "bg-green-50 text-green-700" : "bg-stone-100 text-stone-500"
                            }`}
                    >
                        {customer.allow_credit ? "Habilitado" : "Revocado"}
                    </span>
                ),
            },
            {
                accessor: "_acciones" as keyof ICustomer,
                title: "Acciones",
                width: 120,
                textAlign: "center",
                render: (customer: ICustomer) => (
                    <CustomerTableActions customer={customer} onEdit={setEditingCustomer} />
                ),
            },
        ],
        [setEditingCustomer],
    );

    return (
        <div className="px-5 py-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Clientes</h1>
                    <p className="text-stone-500 text-sm mt-0.5">
                        {total} {total === 1 ? "cliente registrado" : "clientes registrados"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-700 bg-white border border-stone-200 px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors"
                    >
                        <RefreshCw size={15} />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl transition-colors shadow-sm shadow-amber-200"
                    >
                        <Plus size={16} />
                        Nuevo cliente
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 z-10" />
                    <Input
                        name="search"
                        inputType="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o teléfono..."
                        className="pl-9"
                    />
                </div>
                <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={withDebt}
                        onChange={(e) => setWithDebt(e.target.checked)}
                        className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                    />
                    Solo con adeudo
                </label>
            </div>

            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="p-4">
                    <DataTable<ICustomer>
                        columns={columns}
                        records={customers}
                        fetching={isLoading}
                        page={page}
                        recordsPerPage={limit}
                        totalRecords={total}
                        onPageChange={setPage}
                        recordsPerPageOptions={pageSize}
                        onRecordsPerPageChange={setLimit}
                        noRecordsText="No hay clientes registrados"
                        highlightOnHover
                        withTableBorder
                        withColumnBorders
                        striped
                        minHeight={200}
                        className="whitespace-nowrap"
                        paginationText={({ from, to, totalRecords }) =>
                            `Mostrando del ${from} al ${to} de ${totalRecords} registros`
                        }
                    />
                </div>
            </div>

            <AddCustomerModal
                isOpen={addOpen}
                formik={addFormik}
                onClose={closeAdd}
            />

            <EditCustomerModal
                isOpen={editingCustomer !== null}
                customer={editingCustomer}
                formik={editFormik}
                onClose={() => setEditingCustomer(null)}
            />
        </div>
    );
}
