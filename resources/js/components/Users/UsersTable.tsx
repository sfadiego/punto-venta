import { useMemo } from "react";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { Pencil } from "lucide-react";
import { IUser } from "@/models/IUser";
import RoleBadge from "@/components/Role/RoleBadge";
import { useUsersTable } from "./useUsersTable";

interface UsersTableProps {
    users: IUser[];
    total: number;
    page: number;
    limit: number;
    pageSize: number[];
    isLoading: boolean;
    onEdit: (user: IUser) => void;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
}

export const UsersTable = ({
    users,
    total,
    page,
    limit,
    pageSize,
    isLoading,
    onEdit,
    onPageChange,
    onLimitChange,
}: UsersTableProps) => {
    const { baseColumns } = useUsersTable(onEdit);

    const columns = useMemo<DataTableColumn<IUser>[]>(
        () =>
            baseColumns.map((col) => {
                if (col.accessor === "nombre") {
                    return {
                        ...col,
                        render: (u: IUser) => (
                            <span className="font-medium text-stone-900 text-sm">
                                {u.nombre} {u.apellido_paterno}
                            </span>
                        ),
                    };
                }
                if (col.accessor === "usuario") {
                    return {
                        ...col,
                        render: (u: IUser) => (
                            <span className="text-stone-500 text-sm">@{u.usuario}</span>
                        ),
                    };
                }
                if (col.accessor === "email") {
                    return {
                        ...col,
                        render: (u: IUser) => (
                            <span className="text-stone-500 text-sm">{u.email}</span>
                        ),
                    };
                }
                if (col.accessor === "rol_id") {
                    return {
                        ...col,
                        render: (u: IUser) => <RoleBadge rolId={u.rol_id} />,
                    };
                }
                if (col.accessor === "activo") {
                    return {
                        ...col,
                        render: (u: IUser) => (
                            <span
                                className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                                    u.activo
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-stone-100 text-stone-500"
                                }`}
                            >
                                {u.activo ? "Activo" : "Inactivo"}
                            </span>
                        ),
                    };
                }
                if (col.accessor === "_acciones") {
                    return {
                        ...col,
                        render: (u: IUser) => (
                            <button
                                onClick={() => onEdit(u)}
                                className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center transition-colors text-stone-400 hover:text-stone-600"
                                title="Editar usuario"
                            >
                                <Pencil size={14} />
                            </button>
                        ),
                    };
                }
                return col;
            }),
        [baseColumns, onEdit],
    );

    return (
        <DataTable<IUser>
            columns={columns}
            records={users}
            fetching={isLoading}
            page={page}
            recordsPerPage={limit}
            totalRecords={total}
            onPageChange={onPageChange}
            recordsPerPageOptions={pageSize}
            onRecordsPerPageChange={onLimitChange}
            noRecordsText="No hay usuarios registrados"
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
    );
};
