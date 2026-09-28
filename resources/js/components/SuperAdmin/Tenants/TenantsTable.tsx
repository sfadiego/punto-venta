import { DataTable } from "mantine-datatable";
import type { DataTableColumn } from "mantine-datatable";
import { Building2, Pencil, Trash2, PowerOff, Power, RotateCcw, ExternalLink, UtensilsCrossed, Scale, Store, Menu } from "lucide-react";
import { BusinessTypeEnum } from "@/enums/BusinessTypeEnum";
import { ITenant } from "@/models/ITenant";
import { ActiveUsersBadge } from "@/components/SuperAdmin/Tenants/Users/ActiveUsersBadge";
import { InactivityBadge } from "@/components/SuperAdmin/Tenants/Activity/InactivityBadge";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const BUSINESS_TYPE_SHORT_LABELS: Record<BusinessTypeEnum, string> = {
    [BusinessTypeEnum.Restaurante]:  "Restaurante",
    [BusinessTypeEnum.VentaPorPeso]: "Venta por peso",
    [BusinessTypeEnum.Retail]:       "Tienda",
};

const BUSINESS_TYPE_ICONS: Record<BusinessTypeEnum, typeof Scale> = {
    [BusinessTypeEnum.VentaPorPeso]: Scale,
    [BusinessTypeEnum.Retail]:       Store,
    [BusinessTypeEnum.Restaurante]:  UtensilsCrossed,
};

interface TenantsTableProps {
    records: ITenant[];
    totalRecords: number;
    page: number;
    perPage: number;
    limit: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    onEdit: (tenant: ITenant) => void;
    onToggle: (tenant: ITenant) => void;
    onRestore: (tenant: ITenant) => void;
    onDelete: (tenant: ITenant) => void;
}

export const TenantsTable = ({
    records,
    totalRecords,
    page,
    perPage,
    limit: _limit,
    isLoading,
    onPageChange,
    onLimitChange,
    onEdit,
    onToggle,
    onRestore,
    onDelete,
}: TenantsTableProps) => {
    const columns: DataTableColumn<ITenant>[] = [
        {
            accessor: "business_name",
            title: "Cliente",
            render: (row) => {
                const isDeleted = !!row.deleted_at;
                return (
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: row.activo && !isDeleted ? row.primary_color : "#9ca3af" }}
                        >
                            <Building2 size={15} className="text-white" />
                        </div>
                        <p className="text-sm font-medium text-slate-800 truncate">{row.business_name}</p>
                    </div>
                );
            },
        },
        {
            accessor: "slug",
            title: "Acceso",
            render: (row) => (
                <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono">
                    <span className="truncate">/{row.slug}</span>
                    <a
                        href={`${import.meta.env.VITE_APP_URL}/${row.slug}/auth`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir panel del cliente"
                        className="hover:text-indigo-600 transition-colors shrink-0"
                    >
                        <ExternalLink size={11} />
                    </a>
                    <a
                        href={`${import.meta.env.VITE_APP_URL}/${row.slug}/menu`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir menú público"
                        className="hover:text-indigo-600 transition-colors shrink-0"
                    >
                        <Menu size={11} />
                    </a>
                </div>
            ),
        },
        {
            accessor: "_estado",
            title: "Estado",
            render: (row) => {
                const isDeleted = !!row.deleted_at;
                const BusinessTypeIcon = BUSINESS_TYPE_ICONS[row.tipo_negocio];
                return (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {isDeleted && (
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                                Eliminado
                            </span>
                        )}
                        {!isDeleted && !row.activo && (
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                Inactivo
                            </span>
                        )}
                        {row.is_demo && (
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                Demo
                            </span>
                        )}
                        <span className="flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            <BusinessTypeIcon size={11} />
                            {BUSINESS_TYPE_SHORT_LABELS[row.tipo_negocio]}
                        </span>
                    </div>
                );
            },
        },
        {
            accessor: "_actividad",
            title: "Actividad",
            render: (row) => (
                <div className="flex items-center gap-1.5 flex-wrap">
                    <ActiveUsersBadge count={row.active_users_count ?? 0} />
                    <InactivityBadge lastActivityAt={row.last_activity_at} />
                </div>
            ),
        },
        {
            accessor: "users_count",
            title: "Usuarios",
            width: 90,
            render: (row) => <span className="text-sm text-slate-600">{row.users_count ?? 0}</span>,
        },
        {
            accessor: "_acciones",
            title: "",
            render: (row) => {
                const isDeleted = !!row.deleted_at;
                return (
                    <div className="flex items-center gap-1">
                        {isDeleted ? (
                            <button
                                onClick={() => onRestore(row)}
                                title="Restaurar"
                                className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors"
                            >
                                <RotateCcw size={16} />
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => onToggle(row)}
                                    title={row.activo ? "Desactivar" : "Activar"}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                        row.activo
                                            ? "hover:bg-amber-50 text-slate-500 hover:text-amber-600"
                                            : "hover:bg-green-50 text-slate-500 hover:text-green-600"
                                    }`}
                                >
                                    {row.activo ? <PowerOff size={15} /> : <Power size={15} />}
                                </button>
                                <button
                                    onClick={() => onEdit(row)}
                                    title="Editar"
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={() => onDelete(row)}
                                    title="Eliminar"
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <DataTable<ITenant>
            records={records}
            columns={columns}
            fetching={isLoading}
            page={page}
            recordsPerPage={perPage}
            totalRecords={totalRecords}
            onPageChange={onPageChange}
            recordsPerPageOptions={PAGE_SIZE_OPTIONS}
            onRecordsPerPageChange={onLimitChange}
            minHeight={200}
            noRecordsText="No hay clientes en esta categoría"
            highlightOnHover
            withTableBorder
            withColumnBorders
            striped
            borderRadius="md"
            styles={{ header: { background: "#f8fafc" } }}
            paginationText={({ from, to, totalRecords }) =>
                `Mostrando del ${from} al ${to} de ${totalRecords} clientes`
            }
        />
    );
};
