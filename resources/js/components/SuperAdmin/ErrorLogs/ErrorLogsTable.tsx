import { DataTable } from "mantine-datatable";
import type { DataTableColumn } from "mantine-datatable";
import { Eye } from "lucide-react";
import { IErrorLog } from "@/models/IErrorLog";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const METHOD_COLORS: Record<string, string> = {
    GET:    "bg-sky-100 text-sky-700",
    POST:   "bg-emerald-100 text-emerald-700",
    PUT:    "bg-amber-100 text-amber-700",
    PATCH:  "bg-orange-100 text-orange-700",
    DELETE: "bg-red-100 text-red-700",
    CLIENT: "bg-purple-100 text-purple-700",
};

const SOURCE_COLORS: Record<string, string> = {
    frontend: "bg-indigo-100 text-indigo-700",
    backend:  "bg-slate-100 text-slate-700",
};

interface ErrorLogsTableProps {
    records: IErrorLog[];
    totalRecords: number;
    page: number;
    perPage: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    onViewDetail: (log: IErrorLog) => void;
    isLoading: boolean;
}

export const ErrorLogsTable = ({
    records,
    totalRecords,
    page,
    perPage,
    limit: _limit,
    onPageChange,
    onLimitChange,
    onViewDetail,
    isLoading,
}: ErrorLogsTableProps) => {
    const columns: DataTableColumn<IErrorLog>[] = [
        {
            accessor: "id",
            title: "#",
            width: 60,
            render: (row) => <span className="text-xs text-slate-400 font-mono">{row.id}</span>,
        },
        {
            accessor: "source",
            title: "Origen",
            width: 100,
            render: (row) => (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SOURCE_COLORS[row.source] ?? "bg-slate-100 text-slate-500"}`}>
                    {row.source}
                </span>
            ),
        },
        {
            accessor: "method",
            title: "Método",
            width: 90,
            render: (row) => (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${METHOD_COLORS[row.method] ?? "bg-slate-100 text-slate-500"}`}>
                    {row.method}
                </span>
            ),
        },
        {
            accessor: "status_code",
            title: "Código",
            width: 80,
            render: (row) => (
                <span className={`text-xs font-mono font-semibold ${row.status_code >= 500 ? "text-red-600" : row.status_code >= 400 ? "text-amber-600" : "text-slate-500"}`}>
                    {row.status_code || "—"}
                </span>
            ),
        },
        {
            accessor: "endpoint",
            title: "Endpoint",
            render: (row) => (
                <span className="text-xs font-mono text-slate-600 truncate block max-w-xs" title={row.endpoint}>
                    {row.endpoint}
                </span>
            ),
        },
        {
            accessor: "error_message",
            title: "Mensaje",
            render: (row) => (
                <span className="text-xs text-slate-700 truncate block max-w-sm" title={row.error_message}>
                    {row.error_message}
                </span>
            ),
        },
        {
            accessor: "created_at",
            title: "Fecha",
            width: 150,
            render: (row) => (
                <span className="text-xs text-slate-500">
                    {new Date(row.created_at).toLocaleString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </span>
            ),
        },
        {
            accessor: "_detalle",
            title: "",
            width: 60,
            render: (row) => (
                <button
                    onClick={() => onViewDetail(row)}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                    title="Ver detalle"
                >
                    <Eye size={14} />
                </button>
            ),
        },
    ];

    return (
        <DataTable<IErrorLog>
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
            noRecordsText="Sin errores registrados"
            highlightOnHover
            withTableBorder
            withColumnBorders
            striped
            borderRadius="md"
            styles={{ header: { background: "#f8fafc" } }}
            paginationText={({ from, to, totalRecords }) =>
                `Mostrando del ${from} al ${to} de ${totalRecords} registros`
            }
        />
    );
};
