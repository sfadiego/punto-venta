import { useMemo } from "react";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { IUser } from "@/models/IUser";
import RoleBadge from "@/components/Role/RoleBadge";
import { UserStatusCell } from "./UserStatusCell";
import { UserRowActions } from "./UserRowActions";

interface UserTableProps {
    users: IUser[];
    isLoading: boolean;
    tenantId: number;
    onEdit: (user: IUser) => void;
    onDelete: (user: IUser) => void;
}

export const UserTable = ({ users, isLoading, tenantId, onEdit, onDelete }: UserTableProps) => {
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
                width: 140,
                render: (user) => <UserStatusCell user={user} tenantId={tenantId} />,
            },
            {
                accessor: "_acciones" as keyof IUser,
                title: "",
                width: 110,
                textAlign: "center",
                render: (user) => (
                    <UserRowActions user={user} tenantId={tenantId} onEdit={onEdit} onDelete={onDelete} />
                ),
            },
        ],
        [tenantId, onEdit, onDelete],
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
