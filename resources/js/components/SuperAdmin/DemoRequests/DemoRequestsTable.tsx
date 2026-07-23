import { DataTable } from "mantine-datatable";
import type { DataTableColumn } from "mantine-datatable";
import { PhoneCall } from "lucide-react";
import { IDemoRequest } from "@/models/IDemoRequest";
import { BUSINESS_NICHE_LABELS } from "@/enums/BusinessNicheEnum";
import { DEMO_REQUEST_STATUS_LABELS, DemoRequestStatusEnum } from "@/enums/DemoRequestStatusEnum";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUS_COLORS: Record<DemoRequestStatusEnum, string> = {
    [DemoRequestStatusEnum.Pending]:   "bg-amber-100 text-amber-700",
    [DemoRequestStatusEnum.Contacted]: "bg-sky-100 text-sky-700",
    [DemoRequestStatusEnum.Converted]: "bg-emerald-100 text-emerald-700",
    [DemoRequestStatusEnum.Discarded]: "bg-slate-100 text-slate-500",
};

interface DemoRequestsTableProps {
    records: IDemoRequest[];
    totalRecords: number;
    page: number;
    perPage: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    onSelect: (demoRequest: IDemoRequest) => void;
    isLoading: boolean;
}

export const DemoRequestsTable = ({
    records,
    totalRecords,
    page,
    perPage,
    limit: _limit,
    onPageChange,
    onLimitChange,
    onSelect,
    isLoading,
}: DemoRequestsTableProps) => {
    const columns: DataTableColumn<IDemoRequest>[] = [
        {
            accessor: "id",
            title: "#",
            width: 60,
            render: (row) => <span className="text-xs text-slate-400 font-mono">{row.id}</span>,
        },
        {
            accessor: "business_name",
            title: "Negocio",
            render: (row) => <span className="text-sm font-medium text-slate-800">{row.business_name}</span>,
        },
        {
            accessor: "email",
            title: "Email",
            render: (row) => <span className="text-xs text-slate-600">{row.email}</span>,
        },
        {
            accessor: "phone",
            title: "Teléfono",
            render: (row) => <span className="text-xs text-slate-600 font-mono">{row.phone}</span>,
        },
        {
            accessor: "business_niche",
            title: "Giro",
            render: (row) => (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    {BUSINESS_NICHE_LABELS[row.business_niche] ?? row.business_niche}
                </span>
            ),
        },
        {
            accessor: "status",
            title: "Estatus",
            render: (row) => (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[row.status] ?? "bg-slate-100 text-slate-500"}`}>
                    {DEMO_REQUEST_STATUS_LABELS[row.status] ?? row.status}
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
            accessor: "_atender",
            title: "",
            width: 90,
            render: (row) => (
                <button
                    onClick={() => onSelect(row)}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                    title="Atender solicitud"
                >
                    <PhoneCall size={14} />
                    Atender
                </button>
            ),
        },
    ];

    return (
        <DataTable<IDemoRequest>
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
            noRecordsText="Sin solicitudes de demo registradas"
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
