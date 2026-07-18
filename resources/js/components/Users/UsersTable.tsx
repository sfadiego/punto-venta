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

type UserCellRenderer = (u: IUser) => React.ReactNode;

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

    const columns = useMemo<DataTableColumn<IUser>[]>(() => {
        const renderers: Partial<Record<string, UserCellRenderer>> = {
            nombre:    (u) => (
                <span className="font-medium text-stone-900 text-sm">
                    {u.nombre} {u.apellido_paterno}
                </span>
            ),
            usuario:   (u) => <span className="text-stone-500 text-sm">@{u.usuario}</span>,
            email:     (u) => <span className="text-stone-500 text-sm">{u.email}</span>,
            rol_id:    (u) => <RoleBadge rolId={u.rol_id} />,
            activo:    (u) => (
                <span
                    className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                        u.activo ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"
                    }`}
                >
                    {u.activo ? "Activo" : "Inactivo"}
                </span>
            ),
            _acciones: (u) => (
                <button
                    onClick={() => onEdit(u)}
                    className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center transition-colors text-stone-400 hover:text-stone-600"
                    title="Editar usuario"
                >
                    <Pencil size={14} />
                </button>
            ),
        };

        return baseColumns.map((col) => {
            const render = renderers[col.accessor as string];
            return render ? { ...col, render } : col;
        });
    }, [baseColumns, onEdit]);

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
