import { Building2, Plus, Search, Pencil, Trash2, Users, Loader, PowerOff, Power, RotateCcw, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { useTenantList } from "./useTenantList";
import { SuperAdminRoutes } from "@/enums/RoutesEnum";
import { TenantStatusEnum } from "@/enums/TenantStatusEnum";
import { ITenant } from "@/models/ITenant";
import { ActiveUsersWidget } from "@/components/SuperAdmin/Tenants/ActiveUsersWidget";
import { ActiveUsersBadge } from "@/components/SuperAdmin/Tenants/ActiveUsersBadge";

const FILTERS: { label: string; value: TenantStatusEnum }[] = [
    { label: "Todos",      value: TenantStatusEnum.All },
    { label: "Inactivos",  value: TenantStatusEnum.Inactive },
    { label: "Eliminados", value: TenantStatusEnum.Deleted },
];

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

                <ActiveUsersWidget tenants={allTenants} onRefresh={refetch} isRefreshing={isRefetching} />

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

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as TenantStatusEnum)}
                        className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                    >
                        {FILTERS.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                    </select>
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

interface TenantCardProps {
    tenant: ITenant;
    isDeleted: boolean;
    onEdit: () => void;
    onToggle: () => void;
    onRestore: () => void;
    onDelete: () => void;
}

const TenantCard = ({ tenant, isDeleted, onEdit, onToggle, onRestore, onDelete }: TenantCardProps) => (
    <div
        className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-4 transition-opacity ${
            isDeleted
                ? "border-red-100 opacity-60"
                : tenant.activo
                ? "border-slate-100"
                : "border-amber-200 opacity-70"
        }`}
    >
        <div className="flex items-start gap-3">
            <div
                className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: tenant.activo && !isDeleted ? tenant.primary_color : "#9ca3af" }}
            >
                <Building2 size={18} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 truncate">{tenant.business_name}</p>
                    {isDeleted && (
                        <span className="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                            Eliminado
                        </span>
                    )}
                    {!isDeleted && !tenant.activo && (
                        <span className="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            Inactivo
                        </span>
                    )}
                    <ActiveUsersBadge count={tenant.active_users_count ?? 0} />
                </div>
                <a
                    href={`${import.meta.env.VITE_APP_URL}/${tenant.slug}/auth`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-indigo-400 font-mono mt-0.5 hover:text-indigo-600 transition-colors w-fit"
                    title="Abrir panel del cliente"
                >
                    /{tenant.slug}/login
                    <ExternalLink size={11} />
                </a>
            </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users size={14} />
            <span>{tenant.users_count ?? 0} usuario{tenant.users_count !== 1 ? "s" : ""}</span>
        </div>

        <div className="flex gap-2 pt-1 border-t border-slate-100">
            <div className="flex gap-1.5 flex-1">
                {[tenant.primary_color, tenant.sidebar_color, tenant.font_color].map((color, i) => (
                    <span
                        key={i}
                        className="w-5 h-5 rounded-full border border-slate-200"
                        style={{ backgroundColor: color }}
                        title={color}
                    />
                ))}
            </div>

            {isDeleted ? (
                <button
                    onClick={onRestore}
                    title="Restaurar"
                    className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors"
                >
                    <RotateCcw size={20} />
                </button>
            ) : (
                <>
                    <button
                        onClick={onToggle}
                        title={tenant.activo ? "Desactivar" : "Activar"}
                        className={`p-1.5 rounded-lg transition-colors ${
                            tenant.activo
                                ? "hover:bg-amber-50 text-slate-500 hover:text-amber-600"
                                : "hover:bg-green-50 text-slate-500 hover:text-green-600"
                        }`}
                    >
                        {tenant.activo ? <PowerOff size={15} /> : <Power size={15} />}
                    </button>
                    <button
                        onClick={onEdit}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                        <Pencil size={20} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={20} />
                    </button>
                </>
            )}
        </div>
    </div>
);
