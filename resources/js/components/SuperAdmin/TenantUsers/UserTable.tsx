import { useMemo } from "react";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { Pencil, Trash2 } from "lucide-react";
import { IUser } from "@/models/IUser";
import RoleBadge from "@/components/Role/RoleBadge";

interface UserTableProps {
    users: IUser[];
    isLoading: boolean;
    onEdit: (user: IUser) => void;
    onDelete: (user: IUser) => void;
}

export const UserTable = ({ users, isLoading, onEdit, onDelete }: UserTableProps) => {
    const columns = useMemo<DataTableColumn<IUser>[]>(
        () => [
            {
                accessor: "nombre",
                title: "Usuario",
                render: (user) => (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-indigo-600">
                                {user.nombre.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-slate-900 text-sm truncate">
                                {user.nombre} {user.apellido_paterno}
                            </p>
                            <p className="text-xs text-slate-400 font-mono">@{user.usuario}</p>
                        </div>
                    </div>
                ),
            },
            {
                accessor: "email",
                title: "Correo",
                render: (user) => <span className="text-sm text-slate-500">{user.email}</span>,
            },
            {
                accessor: "rol_id",
                title: "Rol",
                width: 120,
                render: (user) => <RoleBadge rolId={user.rol_id} />,
            },
            {
                accessor: "activo",
                title: "Estado",
                width: 100,
                render: (user) => (
                    <span
                        className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${
                            user.activo ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                        }`}
                    >
                        {user.activo ? "Activo" : "Inactivo"}
                    </span>
                ),
            },
            {
                accessor: "_acciones" as keyof IUser,
                title: "",
                width: 80,
                textAlign: "center",
                render: (user) => (
                    <div className="flex items-center justify-center gap-1">
                        <button
                            onClick={() => onEdit(user)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            <Pencil size={20} />
                        </button>
                        <button
                            onClick={() => onDelete(user)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                ),
            },
        ],
        [onEdit, onDelete],
    );

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <DataTable<IUser>
                columns={columns}
                records={users}
                fetching={isLoading}
                noRecordsText="Este cliente no tiene usuarios registrados"
                highlightOnHover
                withTableBorder
                withColumnBorders
                striped
                minHeight={200}
                className="whitespace-nowrap"
            />
        </div>
    );
};
