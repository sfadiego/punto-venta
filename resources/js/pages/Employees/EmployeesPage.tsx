import { useMemo } from "react";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { Plus, RefreshCw, Search } from "lucide-react";
import { IEmployee } from "@/models/IEmployee";
import { Input } from "@/components/ui/form/Input";
import { formatCurrency } from "@/utils/formatCurrency";
import { getSalaryPeriodLabel } from "@/utils/salaryPeriodUtils";
import { useEmployeesPage } from "./useEmployeesPage";
import { SelectEmployeeActiveFilter } from "./partials/SelectEmployeeActiveFilter";
import { WorkDaysBadge } from "./partials/WorkDaysBadge";
import { EmployeeModal } from "./partials/EmployeeModals/EmployeeModal";
import { useEmployeeModal } from "./partials/EmployeeModals/useEmployeeModal";
import { EmployeeTableActions } from "./partials/EmployeeTableActions";

export default function EmployeesPage() {
    const {
        employees,
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
        active,
        setActive,
        invalidateEmployees,
    } = useEmployeesPage();

    const {
        isOpen: modalOpen,
        isEditing,
        editingEmployee,
        openCreateModal,
        openEditModal,
        handleClose: closeModal,
        formik,
    } = useEmployeeModal(invalidateEmployees);

    const columns = useMemo<DataTableColumn<IEmployee>[]>(
        () => [
            {
                accessor: "name",
                title: "Nombre",
                render: (employee: IEmployee) => (
                    <div>
                        <span className="font-medium text-stone-900 text-sm">{employee.name}</span>
                        {employee.phone && (
                            <p className="text-xs text-stone-400 mt-0.5">{employee.phone}</p>
                        )}
                    </div>
                ),
            },
            {
                accessor: "salary",
                title: "Salario",
                render: (employee: IEmployee) => (
                    <span className="text-sm text-stone-600">
                        {formatCurrency(employee.salary)} <span className="text-stone-400">/ {getSalaryPeriodLabel(employee.salary_period)}</span>
                    </span>
                ),
            },
            {
                accessor: "work_days",
                title: "Días",
                render: (employee: IEmployee) => <WorkDaysBadge days={employee.work_days} />,
            },
            {
                accessor: "active",
                title: "Estado",
                render: (employee: IEmployee) => (
                    <span
                        className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${employee.active ? "bg-green-50 text-green-700" : "bg-stone-100 text-stone-500"
                        }`}
                    >
                        {employee.active ? "Activo" : "Oculto"}
                    </span>
                ),
            },
            {
                accessor: "_acciones" as keyof IEmployee,
                title: "Acciones",
                width: 120,
                textAlign: "center",
                render: (employee: IEmployee) => (
                    <EmployeeTableActions employee={employee} onEdit={openEditModal} />
                ),
            },
        ],
        [openEditModal],
    );

    return (
        <div className="px-5 py-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Empleados</h1>
                    <p className="text-stone-500 text-sm mt-0.5">
                        {total} {total === 1 ? "empleado registrado" : "empleados registrados"}
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
                        onClick={openCreateModal}
                        className="flex items-center gap-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl transition-colors shadow-sm shadow-amber-200"
                    >
                        <Plus size={16} />
                        Nuevo empleado
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
                <div className="w-full sm:w-48">
                    <SelectEmployeeActiveFilter value={active} onChange={setActive} />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="p-4">
                    <DataTable<IEmployee>
                        columns={columns}
                        records={employees}
                        fetching={isLoading}
                        page={page}
                        recordsPerPage={limit}
                        totalRecords={total}
                        onPageChange={setPage}
                        recordsPerPageOptions={pageSize}
                        onRecordsPerPageChange={setLimit}
                        noRecordsText="No hay empleados registrados"
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

            <EmployeeModal
                isOpen={modalOpen}
                isEditing={isEditing}
                employee={editingEmployee}
                formik={formik}
                onClose={closeModal}
            />
        </div>
    );
}
