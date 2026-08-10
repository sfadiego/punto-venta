import { Building2, Plus, Search, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { useTenantList } from "./useTenantList";
import { SuperAdminRoutes } from "@/enums/RoutesEnum";
import { TenantStatusEnum } from "@/enums/TenantStatusEnum";
import { ActiveUsersWidget } from "@/components/SuperAdmin/Tenants/Users/ActiveUsersWidget";
import { InactiveTenantsWidget } from "@/components/SuperAdmin/Tenants/Activity/InactiveTenantsWidget";
import { MrrWidget } from "@/components/SuperAdmin/Tenants/Subscription/MrrWidget";
import { SelectTenantFilter } from "./partials/SelectTenantFilter";
import { TenantCard } from "./partials/TenantCard";

export default function TenantListPage() {
    const navigate = useNavigate();
    const {
        tenants,
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
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

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader size={28} className="animate-spin text-indigo-500" />
                    </div>
                ) : tenants.length === 0 ? (
                    <div className="flex flex-col items-center py-20 text-slate-400">
                        <Building2 size={40} className="mb-3 opacity-40" />
                        <p className="font-medium">No hay clientes en esta categoría</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tenants.map((tenant) => (
                            <TenantCard
                                key={tenant.id}
                                tenant={tenant}
                                isDeleted={status === TenantStatusEnum.Deleted}
                                onEdit={() =>
                                    navigate(SuperAdminRoutes.EditTenant.replace(":id", String(tenant.id)))
                                }
                                onToggle={() => handleToggle(tenant)}
                                onRestore={() => handleRestore(tenant)}
                                onDelete={() => handleDelete(tenant)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
}
