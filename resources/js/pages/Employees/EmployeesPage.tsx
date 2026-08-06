import { useEmployeesPage } from "./useEmployeesPage";
import { EmployeeModal } from "./partials/EmployeeModals/EmployeeModal";
import { useEmployeeModal } from "./partials/EmployeeModals/useEmployeeModal";
import { AbsenceModal } from "./partials/Absences/AbsenceModal";
import { useEmployeeAbsenceQuickAdd } from "./partials/Absences/useEmployeeAbsenceQuickAdd";
import { EmployeesPageHeader } from "./partials/EmployeesPageHeader";
import { EmployeesFilters } from "./partials/EmployeesFilters";
import { EmployeesTable } from "./partials/EmployeesTable";

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

    const absenceQuickAdd = useEmployeeAbsenceQuickAdd();

    return (
        <div className="px-5 py-6 max-w-4xl mx-auto">
            <EmployeesPageHeader total={total} onRefresh={refetch} onCreate={openCreateModal} />

            <EmployeesFilters search={search} onSearchChange={setSearch} active={active} onActiveChange={setActive} />

            <EmployeesTable
                employees={employees}
                isLoading={isLoading}
                page={page}
                limit={limit}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onLimitChange={setLimit}
                onEdit={openEditModal}
                onAddAbsence={absenceQuickAdd.openFor}
            />

            <EmployeeModal
                isOpen={modalOpen}
                isEditing={isEditing}
                employee={editingEmployee}
                formik={formik}
                onClose={closeModal}
            />

            <AbsenceModal
                isOpen={absenceQuickAdd.isOpen}
                formik={absenceQuickAdd.formik}
                onClose={absenceQuickAdd.handleClose}
            />
        </div>
    );
}
