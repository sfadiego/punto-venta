import { useMemo } from "react";
import { DataTableColumn } from "mantine-datatable";
import { IUser } from "@/models/IUser";

export const useUsersTable = (onEdit: (user: IUser) => void) => {
    const baseColumns = useMemo<DataTableColumn<IUser>[]>(
        () => [
            { accessor: "nombre",       title: "Nombre" },
            { accessor: "usuario",      title: "Usuario" },
            { accessor: "email",        title: "Email" },
            { accessor: "rol_id",       title: "Rol",    width: 120 },
            { accessor: "activo",       title: "Estado", width: 100 },
            {
                accessor: "_acciones" as keyof IUser,
                title: "Acciones",
                width: 90,
                textAlign: "center" as const,
            },
        ],
        [],
    );

    return { baseColumns, onEdit };
};
