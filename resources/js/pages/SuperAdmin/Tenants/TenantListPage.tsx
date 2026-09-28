import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { useTenantList } from "./useTenantList";
import { SuperAdminRoutes } from "@/enums/RoutesEnum";
import { ActiveUsersWidget } from "@/components/SuperAdmin/Tenants/Users/ActiveUsersWidget";
import { InactiveTenantsWidget } from "@/components/SuperAdmin/Tenants/Activity/InactiveTenantsWidget";
import { MrrWidget } from "@/components/SuperAdmin/Tenants/Subscription/MrrWidget";
import { TenantsTable } from "@/components/SuperAdmin/Tenants/TenantsTable";
import { SelectTenantFilter } from "./partials/SelectTenantFilter";

export default function TenantListPage() {
    const navigate = useNavigate();
    const {
        records,
        totalRecords,
        perPage,
        page,
        setPage,
        limit,
        setLimit,
        allTenants,
        isLoading,
        isRefetching,
        refetch,
        status,
        setStatus,
        demoFilter,
        setDemoFilter,
        search,
        setSearch,
        handleToggle,
        handleRestore,
        handleDelete,
    } = useTenantList();

    return (
        <SuperAdminLayout>
            <div className="px-6 py-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Gestión de tenants del sistema</p>
                    </div>
                    <button
                        onClick={() => navigate(SuperAdminRoutes.NewTenant)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
                    >
                        <Plus size={16} />
                        Nuevo cliente
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <ActiveUsersWidget tenants={allTenants} onRefresh={refetch} isRefreshing={isRefetching} />
                    <InactiveTenantsWidget tenants={allTenants} />
                    <MrrWidget />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o slug..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                    </div>

                    <div className="w-full sm:w-52">
                        <SelectTenantFilter
                            status={status}
                            demoFilter={demoFilter}
                            onStatusChange={setStatus}
                            onDemoFilterChange={setDemoFilter}
                        />
                    </div>
                </div>

                <TenantsTable
                    records={records}
                    totalRecords={totalRecords}
                    page={page}
                    perPage={perPage}
                    limit={limit}
                    isLoading={isLoading}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                    onEdit={(tenant) => navigate(SuperAdminRoutes.EditTenant.replace(":id", String(tenant.id)))}
                    onToggle={handleToggle}
                    onRestore={handleRestore}
                    onDelete={handleDelete}
                />
            </div>
        </SuperAdminLayout>
    );
}
