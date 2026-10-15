import { IEmployee } from "@/models/IEmployee";
import { CustomDataTable } from "@/components/Tables/CustomDataTable";
import { useEmployeesTable } from "./useEmployeesTable";

interface EmployeesTableProps {
    employees: IEmployee[];
    isFetching: boolean;
    page: number;
    limit: number;
    pageSize: number[];
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    onEdit: (employee: IEmployee) => void;
    onAddAbsence: (employee: IEmployee) => void;
}

export const EmployeesTable = ({
    employees,
    isFetching,
    page,
    limit,
    pageSize,
    total,
    onPageChange,
    onLimitChange,
    onEdit,
    onAddAbsence,
}: EmployeesTableProps) => {
    const columns = useEmployeesTable(onEdit, onAddAbsence);

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="p-4">
                <CustomDataTable<IEmployee>
                    columns={columns}
                    records={employees}
                    isFetching={isFetching}
                    fetchingText="Cargando empleados..."
                    page={page}
                    recordsPerPage={limit}
                    totalRecords={total}
                    onPageChange={onPageChange}
                    recordsPerPageOptions={pageSize}
                    onRecordsPerPageChange={onLimitChange}
                    noRecordsText="No hay empleados registrados"
                />
            </div>
        </div>
    );
};
