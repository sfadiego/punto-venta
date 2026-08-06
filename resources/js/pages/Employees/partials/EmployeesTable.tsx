import { DataTable } from "mantine-datatable";
import { IEmployee } from "@/models/IEmployee";
import { useEmployeesTable } from "./useEmployeesTable";

interface EmployeesTableProps {
    employees: IEmployee[];
    isLoading: boolean;
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
    isLoading,
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
                <DataTable<IEmployee>
                    columns={columns}
                    records={employees}
                    fetching={isLoading}
                    page={page}
                    recordsPerPage={limit}
                    totalRecords={total}
                    onPageChange={onPageChange}
                    recordsPerPageOptions={pageSize}
                    onRecordsPerPageChange={onLimitChange}
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
    );
};
