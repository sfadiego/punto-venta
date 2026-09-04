import { Users, RefreshCw, Search, Plus } from "lucide-react";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { ClientLeadsTable } from "@/components/SuperAdmin/ClientLeads/ClientLeadsTable";
import { ClientLeadDetailModal } from "@/components/SuperAdmin/ClientLeads/ClientLeadDetailModal";
import { ClientLeadCreateModal } from "@/components/SuperAdmin/ClientLeads/ClientLeadCreateModal";
import { useClientLeadsPage } from "./useClientLeadsPage";
import { useClientLeadCreate } from "./useClientLeadCreate";
import { ClientLeadStatusEnum, CLIENT_LEAD_STATUS_LABELS } from "@/enums/ClientLeadStatusEnum";

const STATUS_FILTERS: { label: string; value: ClientLeadStatusEnum | "" }[] = [
    { label: "Todos", value: "" },
    ...Object.entries(CLIENT_LEAD_STATUS_LABELS).map(([value, label]) => ({
        label,
        value: value as ClientLeadStatusEnum,
    })),
];

export default function ClientLeadsPage() {
    const {
        records,
        totalRecords,
        perPage,
        page,
        setPage,
        limit,
        setLimit,
        status,
        handleStatusFilterChange,
        search,
        handleSearchChange,
        isLoading,
        refetch,
        selected,
        isSaving,
        openDetail,
        closeDetail,
        handleSave,
    } = useClientLeadsPage();

    const { isCreateOpen, openCreate, closeCreate, isCreating, handleCreate } = useClientLeadCreate();

    return (
        <SuperAdminLayout>
            <div className="px-6 py-6 max-w-7xl mx-auto">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Users size={22} className="text-indigo-500" />
                            Seguimiento
                        </h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            Clientes potenciales registrados desde el formulario de acceso o dados de alta
                            manualmente
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => refetch()}
                            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <RefreshCw size={15} />
                            Actualizar
                        </button>
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg transition-colors"
                        >
                            <Plus size={15} />
                            Nuevo
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por negocio, email o teléfono..."
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {STATUS_FILTERS.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => handleStatusFilterChange(f.value)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap ${
                                    status === f.value
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                <p className="text-xs text-slate-400 mb-3">
                    {totalRecords} cliente{totalRecords !== 1 ? "s" : ""} potencial{totalRecords !== 1 ? "es" : ""}
                </p>

                <ClientLeadsTable
                    records={records}
                    totalRecords={totalRecords}
                    page={page}
                    perPage={perPage}
                    limit={limit}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                    onSelect={openDetail}
                    isLoading={isLoading}
                />
            </div>

            <ClientLeadDetailModal
                clientLead={selected}
                isSaving={isSaving}
                onSave={handleSave}
                onClose={closeDetail}
            />

            <ClientLeadCreateModal
                isOpen={isCreateOpen}
                isSaving={isCreating}
                onSave={handleCreate}
                onClose={closeCreate}
            />
        </SuperAdminLayout>
    );
}
