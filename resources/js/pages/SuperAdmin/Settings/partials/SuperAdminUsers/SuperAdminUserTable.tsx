import { useMemo } from "react";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { Pencil } from "lucide-react";
import { IUser } from "@/models/IUser";
import { formatOrderDateTime } from "@/utils/dateUtils";

interface SuperAdminUserTableProps {
    users: IUser[];
    isLoading: boolean;
    onEdit: (user: IUser) => void;
}

export const SuperAdminUserTable = ({ users, isLoading, onEdit }: SuperAdminUserTableProps) => {
    const columns = useMemo<DataTableColumn<IUser>[]>(
        () => [
            {
                accessor: "nombre",
                title: "Nombre",
                render: (user) => (
                    <span className="text-sm font-medium text-slate-900">
                        {user.nombre} {user.apellido_paterno}
                    </span>
                ),
            },
            {
                accessor: "email",
                title: "Correo",
                render: (user) => <span className="text-sm text-slate-500">{user.email}</span>,
            },
            {
                accessor: "created_at",
                title: "Creado",
                render: (user) => (
                    <span className="text-xs text-slate-400">{formatOrderDateTime(user.created_at)}</span>
                ),
            },
            {
                accessor: "_acciones" as keyof IUser,
                title: "",
                width: 70,
                textAlign: "center",
                render: (user) => (
                    <button
                        type="button"
                        onClick={() => onEdit(user)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                        title="Editar"
                    >
                        <Pencil size={14} />
                    </button>
                ),
            },
        ],
        [onEdit],
    );

    return (
        <div className="rounded-xl border border-slate-100 overflow-hidden">
            <DataTable<IUser>
                columns={columns}
                records={users}
                fetching={isLoading}
                noRecordsText="No hay super administradores registrados"
                highlightOnHover
                withTableBorder={false}
                minHeight={150}
                className="whitespace-nowrap"
            />
        </div>
    );
};
