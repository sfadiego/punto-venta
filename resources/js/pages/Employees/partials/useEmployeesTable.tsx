import { useMemo } from "react";
import { DataTableColumn } from "mantine-datatable";
import { IEmployee } from "@/models/IEmployee";
import { formatCurrency } from "@/utils/formatCurrency";
import { getSalaryPeriodLabel } from "@/utils/salaryPeriodUtils";
import { WorkDaysBadge } from "./WorkDaysBadge";
import { EmployeeTableActions } from "./EmployeeTableActions";

export const useEmployeesTable = (
    onEdit: (employee: IEmployee) => void,
    onAddAbsence: (employee: IEmployee) => void,
): DataTableColumn<IEmployee>[] =>
    useMemo(
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
                    <EmployeeTableActions employee={employee} onEdit={onEdit} onAddAbsence={onAddAbsence} />
                ),
            },
        ],
        [onEdit, onAddAbsence],
    );
