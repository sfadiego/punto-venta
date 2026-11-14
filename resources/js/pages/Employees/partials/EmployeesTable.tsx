import { IEmployee } from "@/models/IEmployee";
import { CustomDataTable } from "@/components/Tables/CustomDataTable";
import { IServerTableProps } from "@/hooks/useServerTable";
import { useEmployeesTable } from "./useEmployeesTable";

interface EmployeesTableProps {
    tableProps: IServerTableProps<IEmployee>;
    onEdit: (employee: IEmployee) => void;
    onAddAbsence: (employee: IEmployee) => void;
}

export const EmployeesTable = ({
    tableProps,
    onEdit,
    onAddAbsence,
}: EmployeesTableProps) => {
    const columns = useEmployeesTable(onEdit, onAddAbsence);

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="p-4">
                <CustomDataTable<IEmployee>
                    columns={columns}
                    {...tableProps}
                    fetchingText="Cargando empleados..."
                    noRecordsText="No hay empleados registrados"
                />
            </div>
        </div>
    );
};
