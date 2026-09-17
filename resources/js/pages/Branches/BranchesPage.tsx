import { useMemo } from "react";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { Plus, RefreshCw, Store } from "lucide-react";
import { IBranch } from "@/models/IBranch";
import { useBranchesPage } from "./useBranchesPage";
import { BranchFormModal } from "./partials/BranchFormModal";
import { useBranchFormModal } from "./partials/useBranchFormModal";
import { BranchUsersModal } from "./partials/BranchUsersModal";
import { BranchTableActions } from "./partials/BranchTableActions";
import { BranchSearch } from "./partials/BranchSearch";

export default function BranchesPage() {
    const {
        branches,
        total,
        page,
        limit,
        pageSize,
        isLoading,
        refetch,
        setPage,
        setLimit,
        search,
        handleSearchChange,
        isFormModalOpen,
        editingBranch,
        openAddModal,
        openEditModal,
        handleCloseFormModal,
        invalidateBranches,
        usersModalBranch,
        openUsersModal,
        closeUsersModal,
    } = useBranchesPage();

    const { isEdit, formik } = useBranchFormModal(editingBranch, invalidateBranches, handleCloseFormModal);

    const columns = useMemo<DataTableColumn<IBranch>[]>(
        () => [
            {
                accessor: "name",
                title: "Nombre",
                render: (branch: IBranch) => (
                    <span className="font-medium text-stone-900 text-sm">{branch.name}</span>
                ),
            },
            {
                accessor: "address",
                title: "Dirección",
                render: (branch: IBranch) => (
                    <span className="text-stone-500 text-sm">{branch.address ?? "—"}</span>
                ),
            },
            {
                accessor: "phone",
                title: "Teléfono",
                render: (branch: IBranch) => (
                    <span className="text-stone-500 text-sm">{branch.phone ?? "—"}</span>
                ),
            },
            {
                accessor: "active",
                title: "Estado",
                width: 100,
                render: (branch: IBranch) => (
                    <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            branch.active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"
                        }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${branch.active ? "bg-emerald-500" : "bg-stone-400"}`} />
                        {branch.active ? "Activa" : "Inactiva"}
                    </span>
                ),
            },
            {
                accessor: "_acciones" as keyof IBranch,
                title: "Acciones",
                width: 150,
                textAlign: "center",
                render: (branch: IBranch) => (
                    <BranchTableActions branch={branch} onEdit={openEditModal} onManageUsers={openUsersModal} />
                ),
            },
        ],
        [openEditModal, openUsersModal],
    );

    return (
        <div className="px-5 py-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Store size={20} className="text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900">Sucursales</h1>
                        <p className="text-stone-500 text-sm mt-0.5">
                            {total} {total === 1 ? "sucursal registrada" : "sucursales registradas"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-700 bg-white border border-stone-200 px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors"
                    >
                        <RefreshCw size={15} />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl transition-colors shadow-sm shadow-amber-200"
                    >
                        <Plus size={16} />
                        Nueva sucursal
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="px-4 pt-4">
                    <BranchSearch value={search} onChange={handleSearchChange} />
                </div>
                <div className="p-4">
                    <DataTable<IBranch>
                        columns={columns}
                        records={branches}
                        fetching={isLoading}
                        page={page}
                        recordsPerPage={limit}
                        totalRecords={total}
                        onPageChange={setPage}
                        recordsPerPageOptions={pageSize}
                        onRecordsPerPageChange={setLimit}
                        noRecordsText="No hay sucursales registradas"
                        rowClassName={(branch) => (!branch.active ? "!bg-red-50" : undefined)}
                        highlightOnHover
                        withTableBorder
                        withColumnBorders
                        striped
                        minHeight={200}
                        className="whitespace-nowrap"
                        classNames={{ header: "pos-datatable-header" }}
                        paginationText={({ from, to, totalRecords }) =>
                            `Mostrando del ${from} al ${to} de ${totalRecords} registros`
                        }
                    />
                </div>
            </div>

            <BranchFormModal
                isOpen={isFormModalOpen}
                isEdit={isEdit}
                formik={formik}
                onClose={handleCloseFormModal}
            />

            <BranchUsersModal
                isOpen={!!usersModalBranch}
                branchId={usersModalBranch?.id ?? null}
                branchName={usersModalBranch?.name ?? ""}
                onClose={closeUsersModal}
            />
        </div>
    );
}
