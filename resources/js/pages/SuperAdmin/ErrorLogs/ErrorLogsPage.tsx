import { AlertTriangle, RefreshCw } from "lucide-react";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { ErrorLogsTable } from "@/components/SuperAdmin/ErrorLogs/ErrorLogsTable";
import { ErrorLogDetailModal } from "@/components/SuperAdmin/ErrorLogs/ErrorLogDetailModal";
import { useErrorLogsPage } from "./useErrorLogsPage";

const SOURCE_FILTERS = [
    { label: "Todos",    value: "" },
    { label: "Frontend", value: "frontend" },
    { label: "Backend",  value: "backend" },
] as const;

export default function ErrorLogsPage() {
    const {
        records,
        totalRecords,
        perPage,
        page,
        setPage,
        limit,
        setLimit,
        source,
        handleSourceChange,
        isLoading,
        refetch,
        selectedLog,
        openDetail,
        closeDetail,
    } = useErrorLogsPage();

    return (
        <SuperAdminLayout>
            <div className="px-6 py-6 max-w-7xl mx-auto">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <AlertTriangle size={22} className="text-red-500" />
                            Logs de errores
                        </h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            Monitoreo de errores del sistema registrados en tiempo real
                        </p>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <RefreshCw size={15} />
                        Actualizar
                    </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                    {SOURCE_FILTERS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => handleSourceChange(f.value)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                                source === f.value
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                    <span className="text-xs text-slate-400 ml-auto">
                        {totalRecords} registro{totalRecords !== 1 ? "s" : ""}
                    </span>
                </div>

                <ErrorLogsTable
                    records={records}
                    totalRecords={totalRecords}
                    page={page}
                    perPage={perPage}
                    limit={limit}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                    onViewDetail={openDetail}
                    isLoading={isLoading}
                />
            </div>

            <ErrorLogDetailModal log={selectedLog} onClose={closeDetail} />
        </SuperAdminLayout>
    );
}
